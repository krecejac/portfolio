import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { pool } from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth, AuthRequest } from "./auth";
import {
  scoreConditions,
  windTypeLabel,
  surfHeight,
  swellEnergy,
  consistency,
  tideInfo,
  wetsuit,
  sunscreen,
  weatherLabel,
  type Swell,
} from "./surf-model";

const app = express();
// Trust the platform's proxy so req.protocol reflects the real https scheme.
app.set("trust proxy", true);
// Cloud platforms inject the port to listen on via PORT. Fall back to 3001 locally.
const PORT = Number(process.env.PORT) || 3001;

// Allow the frontend to call this API
app.use(cors());
app.use(express.json());

// --- Email (account verification) -------------------------------------------
// Build a mailer from SMTP_* env, or null when none is configured. Without SMTP
// (local/demo) we just log the verification link so the flow still works.
function makeMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}
const mailer = makeMailer();

async function sendVerifyEmail(to: string, link: string) {
  if (!mailer) {
    console.log(`\n[verify] Verification link for ${to}:\n${link}\n`);
    return;
  }
  await mailer.sendMail({
    from: process.env.MAIL_FROM || "Swell <no-reply@swell.app>",
    to,
    subject: "Confirm your Swell account",
    text: `Welcome to Swell! Confirm your email: ${link}`,
    html: `<p>Welcome to Swell 🌊</p>
           <p>Confirm your email to finish setting up your account:</p>
           <p><a href="${link}">Verify my email</a></p>
           <p style="color:#64748b;font-size:13px">If you didn't sign up, you can ignore this email.</p>`,
  });
}

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

// 315 -> "NW". Split the circle into 16 slices of 22.5 deg and pick the nearest.
function degToCompass(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16];
}

// --- Surf forecast: Open-Meteo -> surf model -> DB snapshot ------------------
// Raw shapes of the two Open-Meteo responses (only the fields we read).
interface MarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_period: number[];
    wave_direction: number[];
    swell_wave_height: number[];
    swell_wave_period: number[];
    swell_wave_direction: number[];
    swell_wave_peak_period: number[];
    secondary_swell_wave_height: (number | null)[];
    secondary_swell_wave_period: (number | null)[];
    secondary_swell_wave_direction: (number | null)[];
    wind_wave_height: number[];
    wind_wave_period: number[];
    wind_wave_direction: number[];
    sea_surface_temperature: number[];
    sea_level_height_msl: number[];
  };
}

interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    cloud_cover: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
}

// A stored snapshot is served straight from the DB until it's this old.
const FORECAST_TTL_MS = 60 * 60 * 1000; // 1 hour

// The swell trains present at hour `i`: primary swell, secondary swell and the
// local wind wave. Absent/tiny trains are dropped and the rest sorted biggest
// first (the biggest one shapes the surf).
function swellTrains(m: MarineResponse["hourly"], i: number): Swell[] {
  const raw = [
    { height: m.swell_wave_height[i], period: m.swell_wave_period[i], direction: m.swell_wave_direction[i] },
    { height: m.secondary_swell_wave_height[i], period: m.secondary_swell_wave_period[i], direction: m.secondary_swell_wave_direction[i] },
    { height: m.wind_wave_height[i], period: m.wind_wave_period[i], direction: m.wind_wave_direction[i] },
  ];
  return raw
    .filter(
      (s): s is { height: number; period: number; direction: number } =>
        s.height != null && s.period != null && s.direction != null && s.height >= 0.1,
    )
    .sort((a, b) => b.height - a.height)
    .map((s) => ({
      height: Math.round(s.height * 10) / 10,
      period: Math.round(s.period * 10) / 10,
      direction: Math.round(s.direction),
      compass: degToCompass(s.direction),
    }));
}

// Assemble the full enriched snapshot for one spot from the two raw responses.
function buildSnapshot(
  marine: MarineResponse,
  weather: WeatherResponse,
  orientation: number | null,
) {
  const mh = marine.hourly;
  const wh = weather.hourly;

  // Current hour = the last hourly timestamp at/just before "now". Both feeds
  // use timezone=auto, so the naive ISO strings compare correctly as text.
  const nowStr = weather.current.time;
  let now = 0;
  for (let i = 0; i < mh.time.length; i++) {
    if (mh.time[i] <= nowStr) now = i;
    else break;
  }

  // --- current conditions ---
  const hs = mh.wave_height[now];
  const tp = mh.swell_wave_peak_period[now] || mh.wave_period[now];
  const swellDir = mh.swell_wave_direction[now] ?? mh.wave_direction[now];
  const windSpeed = weather.current.wind_speed_10m;
  const windGust = weather.current.wind_gusts_10m;
  const windDir = weather.current.wind_direction_10m;

  const scored = scoreConditions({ hs, tp, swellDir, windSpeed, windGust, windDir, orientation });
  const trains = swellTrains(mh, now);
  const uvMax = weather.daily.uv_index_max[0];
  const sst = mh.sea_surface_temperature[now];

  const current = {
    // legacy fields (existing UI reads these)
    waveHeight: Math.round(hs * 10) / 10,
    wavePeriod: Math.round(tp * 10) / 10,
    waveDirection: Math.round(swellDir),
    directionLabel: degToCompass(swellDir),
    windSpeed: Math.round(windSpeed),
    windDirection: Math.round(windDir),
    windLabel: degToCompass(windDir),
    windType: windTypeLabel(windDir, orientation),
    score: scored.score,
    rating: scored.rating,
    // model detail
    parts: scored.parts,
    surfHeight: surfHeight(hs),
    swells: trains,
    energy: swellEnergy(trains),
    consistency: consistency(trains, tp),
    // wind, water, weather, sun
    windGust: Math.round(windGust),
    waterTemp: Math.round(sst),
    wetsuit: wetsuit(sst),
    airTemp: Math.round(weather.current.temperature_2m),
    weather: weatherLabel(weather.current.weather_code),
    cloudCover: weather.current.cloud_cover,
    uvMax: Math.round(uvMax),
    sunscreen: sunscreen(uvMax),
    tide: tideInfo(mh.time, mh.sea_level_height_msl, now),
    sunrise: weather.daily.sunrise[0],
    sunset: weather.daily.sunset[0],
    time: mh.time[now],
  };

  // --- hourly series (for charts) ---
  const hourly = {
    time: mh.time,
    wave_height: mh.wave_height,
    wave_period: mh.wave_period,
    wave_direction: mh.wave_direction,
    sea_level_height_msl: mh.sea_level_height_msl,
    wind_speed_10m: wh.wind_speed_10m,
    wind_direction_10m: wh.wind_direction_10m,
    wind_gusts_10m: wh.wind_gusts_10m,
  };

  // --- 7-day outlook: score each day at its biggest-wave hour ---
  const daily: { date: string; waveHeight: number; score: number; rating: string }[] = [];
  for (let d = 0; d < 7; d++) {
    const from = d * 24;
    const slice = mh.wave_height.slice(from, from + 24);
    if (!slice.length) break;
    let peak = 0;
    for (let k = 1; k < slice.length; k++) if (slice[k] > slice[peak]) peak = k;
    const h = from + peak;
    const s = scoreConditions({
      hs: mh.wave_height[h],
      tp: mh.swell_wave_peak_period[h] || mh.wave_period[h],
      swellDir: mh.swell_wave_direction[h] ?? mh.wave_direction[h],
      windSpeed: wh.wind_speed_10m[h],
      windGust: wh.wind_gusts_10m[h],
      windDir: wh.wind_direction_10m[h],
      orientation,
    });
    daily.push({
      date: mh.time[h].slice(0, 10),
      waveHeight: Math.round(mh.wave_height[h] * 10) / 10,
      score: s.score,
      rating: s.rating,
    });
  }

  return { current, hourly, daily };
}

// GET /api/forecast?latitude=&longitude=&orientation=&id=
// Read-through DB cache: serve a stored snapshot if it's < FORECAST_TTL_MS old,
// otherwise fetch Open-Meteo, run the surf model, store the snapshot, return it.
app.get("/api/forecast", async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }
    const orientation =
      req.query.orientation != null ? Number(req.query.orientation) : null;
    const spotId = req.query.id != null ? Number(req.query.id) : null;

    // 1. Read-through: return a fresh stored snapshot if we have one.
    if (spotId != null) {
      const hit = await pool.query(
        "SELECT snapshot, fetched_at FROM spot_conditions WHERE spot_id = $1",
        [spotId],
      );
      if (hit.rows.length) {
        const age = Date.now() - new Date(hit.rows[0].fetched_at).getTime();
        if (age < FORECAST_TTL_MS) return res.json(hit.rows[0].snapshot);
      }
    }

    // 2. Fetch both Open-Meteo endpoints in parallel.
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,swell_wave_peak_period,secondary_swell_wave_height,secondary_swell_wave_period,secondary_swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction,sea_surface_temperature,sea_level_height_msl&timezone=auto&forecast_days=7`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`;

    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl),
      fetch(weatherUrl),
    ]);
    const marine = (await marineRes.json()) as MarineResponse;
    const weather = (await weatherRes.json()) as WeatherResponse;

    // 3. Run the surf model.
    const payload = buildSnapshot(marine, weather, orientation);

    // 4. Store the snapshot per spot so the next reader hits the DB, not the API.
    if (spotId != null) {
      await pool.query(
        `INSERT INTO spot_conditions (spot_id, fetched_at, rating, score, wave_height, snapshot)
         VALUES ($1, now(), $2, $3, $4, $5)
         ON CONFLICT (spot_id) DO UPDATE
           SET fetched_at = now(), rating = $2, score = $3, wave_height = $4, snapshot = $5`,
        [
          spotId,
          payload.current.rating,
          payload.current.score,
          payload.current.waveHeight,
          JSON.stringify(payload),
        ],
      );
    }

    res.json(payload);
  } catch (error) {
    console.error("API error:", error);
    res
      .status(500)
      .json({ error: "Backend failed to fetch data from Open-Meteo." });
  }
});

// --- Live cams (Windy Webcams API) ------------------------------------------
// The webcam list near a spot is stable, so we cache it far longer than the
// forecast. Keyed by rounded coords so nearby lookups share an entry.
const camsCache = new Map<string, { data: unknown; timestamp: number }>();
const CAMS_TTL = 6 * 60 * 60 * 1000; // 6 hours

// The subset of the Windy Webcams v3 response we care about. The `player` fields
// come back either as a plain embed-URL string or as an object { embed }, so we
// keep them loosely typed and normalise with pickEmbed() below.
interface WindyWebcam {
  webcamId: number;
  title: string;
  status: string;
  viewCount?: number;
  images?: { current?: { preview?: string; thumbnail?: string } };
  location?: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  player?: Record<string, unknown>;
}
interface WindyWebcamsResponse {
  total: number;
  webcams: WindyWebcam[];
}

// Great-circle distance in km between two lat/lon points (haversine). Used to
// tell the user how far a webcam actually is from the spot — remote spots often
// have no cam nearby, so Windy returns whatever's closest, hundreds of km away.
function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Windy returns a player as either "https://…" or { embed: "https://…" }.
function pickEmbed(p: unknown): string | null {
  if (typeof p === "string") return p || null;
  if (p && typeof p === "object" && "embed" in p) {
    const e = (p as { embed?: unknown }).embed;
    return typeof e === "string" && e ? e : null;
  }
  return null;
}

// GET /api/cams?lat=&lon=  — cams near a spot, from two sources:
//   live      = real YouTube video streams from our harvested `cams` table
//               (works with no external key; nearest-first within radius)
//   timelapse = Windy webcams (periodic snapshots) as an optional fallback
// Both carry the distance in km so the frontend can be honest about how close
// the nearest cam actually is.
app.get("/api/cams", async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing lat or lon." });
    }
    const qLat = Number(lat);
    const qLon = Number(lon);
    const radius = req.query.radius ? Number(req.query.radius) : 150; // km

    // Round coords to ~0.1 deg so nearby spots reuse the same cached result.
    const cacheKey = `${qLat.toFixed(1)},${qLon.toFixed(1)},${radius}`;
    const cached = camsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CAMS_TTL) {
      return res.json(cached.data);
    }

    // 1) Live video cams from our DB — haversine distance, nearest within radius.
    const liveResult = await pool.query(
      `SELECT youtube_id, title, city, country, distance FROM (
         SELECT youtube_id, title, city, country,
           6371 * 2 * asin(sqrt(
             power(sin(radians(($1 - lat) / 2)), 2) +
             cos(radians($1)) * cos(radians(lat)) *
             power(sin(radians(($2 - lon) / 2)), 2)
           )) AS distance
         FROM cams
       ) t
       WHERE distance <= $3
       ORDER BY distance ASC
       LIMIT 12`,
      [qLat, qLon, radius],
    );
    const live = liveResult.rows.map((r) => ({
      id: r.youtube_id as string,
      title: r.title as string,
      place: [r.city, r.country].filter(Boolean).join(", "),
      distanceKm: Math.round(Number(r.distance)),
    }));

    // 2) Windy timelapses (optional — only if a key is configured). Wrapped so a
    //    Windy failure never breaks the live video cams above.
    let timelapse: unknown[] = [];
    const key = process.env.WINDY_WEBCAMS_KEY;
    if (key) {
      try {
        // Timelapse cams are plentiful, so keep them genuinely near — a webcam
        // 50 km away is a different beach. (Live video is rarer, so it uses the
        // wider `radius` above.)
        const timelapseRadius = Math.min(radius, 40);
        const url =
          `https://api.windy.com/webcams/api/v3/webcams` +
          `?nearby=${lat},${lon},${timelapseRadius}` +
          `&categories=beach&include=images,player,location&limit=24`;
        const apiRes = await fetch(url, { headers: { "x-windy-api-key": key } });
        if (apiRes.ok) {
          const body = (await apiRes.json()) as WindyWebcamsResponse;
          timelapse = (body.webcams ?? [])
            .filter((w) => w.status === "active")
            .map((w) => {
              const wLat = w.location?.latitude;
              const wLon = w.location?.longitude;
              return {
                id: w.webcamId,
                title: w.title,
                place: [w.location?.city, w.location?.country]
                  .filter(Boolean)
                  .join(", "),
                distanceKm:
                  wLat != null && wLon != null
                    ? distanceKm(qLat, qLon, wLat, wLon)
                    : null,
                preview:
                  w.images?.current?.preview ??
                  w.images?.current?.thumbnail ??
                  null,
                embedLive: pickEmbed(w.player?.live),
                embedDay: pickEmbed(w.player?.day),
              };
            })
            .sort(
              (a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999),
            );
        }
      } catch (e) {
        console.error("Windy cams error (non-fatal):", e);
      }
    }

    const payload = { live, timelapse };
    camsCache.set(cacheKey, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (error) {
    console.error("Cams API error:", error);
    res.status(500).json({ error: "Failed to load cams." });
  }
});

// GET /api/cams/list  — the whole live-webcam catalog (for the global grid on
// the Cams page), each with a coarse region for client-side filtering. Small
// enough (a few hundred rows) to send in one response.
app.get("/api/cams/list", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT youtube_id, title, city, country, region, lat, lon FROM cams ORDER BY region, country, title",
    );
    const cams = result.rows.map((r) => ({
      id: r.youtube_id as string,
      title: r.title as string,
      place: [r.city, r.country].filter(Boolean).join(", "),
      region: (r.region as string) || "Other",
      lat: Number(r.lat),
      lon: Number(r.lon),
    }));
    res.json({ total: cams.length, cams });
  } catch (error) {
    console.error("Cam list error:", error);
    res.status(500).json({ error: "Failed to load cam list." });
  }
});

// GET /api/spots  — the full spot catalog (the frontend fetches forecasts per
// spot separately; see /api/forecast).
app.get("/api/spots", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, name, lat, lon, region, description, featured, orientation FROM spots ORDER BY id",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to load spots from database." });
  }
});

// POST /api/auth/register  — create a user, then email them a verification link.
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(24).toString("hex");
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, verify_token) VALUES ($1, $2, $3) RETURNING id, email",
      [email, passwordHash, verifyToken],
    );

    // Build the confirmation link from the request's real host/scheme (behind a
    // proxy that means the x-forwarded-proto header), then send or log it.
    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
    const link = `${proto}://${req.get("host")}/api/auth/verify?token=${verifyToken}`;
    await sendVerifyEmail(email, link);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Postgres unique-violation code -> the email is already taken.
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return res.status(409).json({ error: "Email is already registered." });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Failed to register user." });
  }
});

// POST /api/auth/login  — verify credentials, return a JWT valid for 7 days.
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];

    // Unknown email and wrong password return the same 401, so the response
    // can't be used to probe which emails are registered.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to log in." });
  }
});

// GET /api/auth/verify?token=  — confirm an email from the link we sent.
app.get("/api/auth/verify", async (req: Request, res: Response) => {
  const token = String(req.query.token || "");
  const page = (title: string, body: string) =>
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
     <body style="font-family:system-ui,sans-serif;background:#fecb85;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center">
       <div style="background:#fff;border-radius:16px;padding:40px;max-width:420px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.15)">
         <div style="font-size:40px">🌊</div>
         <h1 style="font-size:22px;margin:12px 0 6px;color:#0f172a">${title}</h1>
         <p style="color:#64748b;line-height:1.5">${body}</p>
       </div>
     </body></html>`;

  if (!token) {
    return res.status(400).send(page("Invalid link", "This verification link is missing its token."));
  }
  try {
    const result = await pool.query(
      "UPDATE users SET verified = true, verify_token = NULL WHERE verify_token = $1 RETURNING email",
      [token],
    );
    if (!result.rowCount) {
      return res
        .status(400)
        .send(page("Link expired", "This link is invalid or has already been used. Your email may already be verified."));
    }
    res.send(page("Email verified", "Your Swell account is confirmed. You can close this tab and head back to the app."));
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).send(page("Something went wrong", "Please try the link again in a moment."));
  }
});

// GET /api/favorites  — spot ids the logged-in user has favorited
app.get(
  "/api/favorites",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT spot_id FROM favorites WHERE user_id = $1",
        [req.userId],
      );
      res.json(result.rows.map((row) => row.spot_id));
    } catch (error) {
      console.error("Favorites load error:", error);
      res.status(500).json({ error: "Failed to load favorites." });
    }
  },
);

// POST /api/favorites/:spotId  — add one favorite
app.post("/api/favorites/:spotId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const spotId = Number(req.params.spotId);
    await pool.query(
      "INSERT INTO favorites (user_id, spot_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.userId, spotId],
    );
    res.status(201).json({ spotId });
  } catch (error) {
    console.error("Favorite add error:", error);
    res.status(500).json({ error: "Failed to add favorite." });
  }
});

// DELETE /api/favorites/:spotId  — remove one favorite
app.delete("/api/favorites/:spotId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const spotId = Number(req.params.spotId);
    await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND spot_id = $2",
      [req.userId, spotId],
    );
    res.status(204).end(); // 204 No Content: success, nothing to return
  } catch (error) {
    console.error("Favorite remove error:", error);
    res.status(500).json({ error: "Failed to remove favorite." });
  }
});

// GET /api/profile  — the logged-in user's email + saved home region
app.get("/api/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT email, home_region, verified FROM users WHERE id = $1",
      [req.userId],
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Profile load error:", error);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

// PUT /api/profile  — update the user's home region preference
app.put("/api/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { homeRegion } = req.body;
    const result = await pool.query(
      "UPDATE users SET home_region = $1 WHERE id = $2 RETURNING email, home_region",
      [homeRegion ?? null, req.userId],
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Surf backend running at http://localhost:${PORT}`);
});
