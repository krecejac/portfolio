import "dotenv/config"
import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./db";

const app = express();
// Cloud platforms inject the port to listen on via PORT. Fall back to 3001 locally.
const PORT = Number(process.env.PORT) || 3001;

// Allow the frontend to call this API
app.use(cors());

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

// Derive a condition rating from the wave height. Returns only the label;
// colors are the frontend's job (presentation stays on the frontend).
function getRating(waveHeight: number): string {
  if (waveHeight < 0.5) return "FLAT";
  if (waveHeight < 1) return "POOR";
  if (waveHeight < 1.8) return "FAIR";
  if (waveHeight < 3) return "GOOD";
  return "EPIC";
}

// Shape of the raw Open-Meteo marine response (only the fields we use).
interface MarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
  };
}

//cache
// coords -> { data, timestamp } ; forecasts don't change faster than hourly
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// GET /api/forecast
app.get("/api/forecast", async (req: Request, res: Response) => {
  try {
    // 1. Grab the coordinates the React frontend sends us (from req.query)
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    // 2. Call Open-Meteo. The heavy query params stay hidden here on the server.
    const meteoUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wave_direction,wave_period&timezone=auto&forecast_days=7`;

    const key = `${latitude},${longitude}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`CACHE HIT   ${key}`);
      return res.json(cached.data);
    }

    console.log(`CACHE MISS  ${key} -> fetching from Open-Meteo`);

    // Native Node.js fetch
    const response = await fetch(meteoUrl);
    const data = (await response.json()) as MarineResponse;

    // Open-Meteo returns { hourly: { wave_height: [...], ... } }.
    // Index [0] is the current hour.
    const waveHeight = data.hourly.wave_height[0];
    const wavePeriod = data.hourly.wave_period[0];
    const waveDirection = data.hourly.wave_direction[0];

    // 3. Build the pre-chewed "current" object the card needs.
    const current = {
      waveHeight,
      wavePeriod,
      waveDirection,
      directionLabel: degToCompass(waveDirection),
      rating: getRating(waveHeight),
    };

    // Send "current" for the card + raw "hourly" for the future 7-day chart.
    const payload = { current, hourly: data.hourly };
    cache.set(key, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (error) {
    console.error("API error:", error);
    res
      .status(500)
      .json({ error: "Backend failed to fetch data from Open-Meteo." });
  }
});

app.get("/api/spots", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, name, lat, lon FROM spots ORDER BY id",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to load spots from database." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Surf backend running at http://localhost:${PORT}`);
});
