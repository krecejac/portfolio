// =============================================================================
// Surf-quality model
// =============================================================================
// Deterministic, physically-motivated heuristics — NOT machine learning. Every
// function here is pure (same input -> same output), so the whole model is easy
// to reason about and unit-test. It turns the raw numbers from the wave/weather
// models into the things a surfer actually reads: a 0-100 score + rating band,
// a surf-height range, ranked swell trains, wind quality, tide state, and the
// water/air comfort calls (wetsuit, sunscreen).
//
// The index.ts endpoint fetches Open-Meteo and calls into this module; keeping
// the maths here means the scoring logic lives in one place and never touches
// HTTP, the database, or the cache.

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

/** Clamp a number into 0..1. */
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Round to one decimal place (metres, seconds, etc.). */
function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/** Smallest angle between two compass bearings, always 0..180. */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
] as const;

/** 315 -> "NW". Handles negative / out-of-range degrees. */
export function degToCompass(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  return COMPASS[Math.round(norm / 22.5) % 16];
}

// ---------------------------------------------------------------------------
// Sub-scores — each returns 0..1, where 1 is "as good as this factor gets"
// ---------------------------------------------------------------------------

/**
 * Rideable-size curve (from significant wave height, metres).
 * Nothing under ~0.3 m, ramps up across the fun/rippable band, plateaus through
 * the solid 2.5-4 m range, then eases off — huge surf is heavier and more
 * closed-out, not automatically "better".
 */
export function sizeScore(hs: number): number {
  if (hs < 0.3) return 0;
  if (hs < 1.0) return ((hs - 0.3) / 0.7) * 0.8; // 0.3m -> 0, 1.0m -> 0.8
  if (hs <= 2.5) return 0.8 + ((hs - 1.0) / 1.5) * 0.2; // 1.0m -> 0.8, 2.5m -> 1.0
  if (hs <= 4.0) return 1.0; // solid and clean
  return Math.max(0.6, 1.0 - (hs - 4.0) * 0.1); // 5m -> 0.9 ... floors at 0.6
}

/**
 * Period quality (peak period, seconds). Period is the single biggest quality
 * signal: long-period groundswell has orderly, powerful lines; short-period
 * windswell is weak and disorganised.
 */
export function periodScore(tp: number): number {
  if (tp <= 6) return 0.15;
  if (tp >= 16) return 1.0;
  return 0.15 + ((tp - 6) / 10) * 0.85; // 6s -> 0.15 ... 16s -> 1.0
}

/**
 * How squarely the primary swell enters the spot's window. Swell arrives FROM
 * `swellDir`; the spot faces `orientation` out to sea, so swell coming straight
 * from that bearing wraps in with the most power. Unknown facing -> no penalty.
 */
export function swellDirScore(
  swellDir: number,
  orientation: number | null,
): number {
  if (orientation == null) return 1;
  const off = angleDiff(swellDir, orientation);
  if (off <= 30) return 1;
  if (off >= 110) return 0.25;
  return 1 - ((off - 30) / 80) * 0.75; // 30deg -> 1.0 ... 110deg -> 0.25
}

/**
 * Wind quality. Offshore wind (blowing from land out to sea) holds the wave
 * face up and grooms it; onshore wind (off the sea) crumbles it. Light wind
 * barely matters from any direction — strong, gusty onshore is the biggest
 * quality-killer, so we blend mean speed with gusts. Unknown facing -> we can
 * only penalise raw strength.
 */
export function windScore(
  speedKmh: number,
  gustKmh: number | null,
  windDir: number,
  orientation: number | null,
): number {
  const speed = (speedKmh + (gustKmh ?? speedKmh)) / 2;
  if (orientation == null) {
    return clamp01(1 - Math.max(0, speed - 12) / 40); // calm -> 1, 52km/h -> 0
  }
  // Onshore-ness: 1 when wind comes straight off the sea (windDir ~ orientation),
  // 0 when it blows straight offshore (windDir ~ orientation + 180).
  const onshore =
    (1 + Math.cos((angleDiff(windDir, orientation) * Math.PI) / 180)) / 2;
  // Penalty grows with speed; light wind is fine regardless of direction.
  const strength = clamp01((speed - 6) / 34); // 6km/h -> 0 ... 40km/h -> 1
  return clamp01(1 - onshore * strength);
}

/** Human wind label relative to the spot's facing. */
export function windTypeLabel(
  windDir: number,
  orientation: number | null,
): "offshore" | "cross" | "onshore" | null {
  if (orientation == null) return null;
  const a = angleDiff(windDir, orientation);
  if (a >= 120) return "offshore"; // wind FROM opposite the facing = offshore
  if (a <= 60) return "onshore";
  return "cross";
}

// ---------------------------------------------------------------------------
// Overall score + rating band
// ---------------------------------------------------------------------------

export type RatingLabel = "FLAT" | "POOR" | "FAIR" | "GOOD" | "EPIC";

export function ratingFromScore(score: number): RatingLabel {
  if (score < 15) return "FLAT";
  if (score < 35) return "POOR";
  if (score < 55) return "FAIR";
  if (score < 75) return "GOOD";
  return "EPIC";
}

export interface ScoreInput {
  hs: number; // significant wave height, m
  tp: number; // peak period, s
  swellDir: number; // primary swell direction, deg (coming FROM)
  windSpeed: number; // km/h
  windGust: number | null; // km/h
  windDir: number; // deg (coming FROM)
  orientation: number | null; // spot facing, deg
}

export interface ScoreResult {
  score: number; // 0..100
  rating: RatingLabel;
  parts: { size: number; period: number; swellDir: number; wind: number }; // 0..1 each
}

/**
 * Combine the sub-scores into one 0-100 number.
 *   raw     = the "surf on offer" (size + period), before conditions
 *   quality = how well it's presented (swell angle x wind)
 * A weak wind day never fully zeroes a big clean swell (the 0.4 floor), but
 * clean offshore conditions on a good swell push it toward EPIC.
 */
export function scoreConditions(i: ScoreInput): ScoreResult {
  const size = sizeScore(i.hs);
  const period = periodScore(i.tp);
  const dir = swellDirScore(i.swellDir, i.orientation);
  const wind = windScore(i.windSpeed, i.windGust, i.windDir, i.orientation);

  const raw = 0.5 * size + 0.5 * period;
  const quality = dir * wind;
  const score = Math.round(100 * raw * (0.4 + 0.6 * quality));

  return {
    score,
    rating: ratingFromScore(score),
    parts: { size, period, swellDir: dir, wind },
  };
}

// ---------------------------------------------------------------------------
// Derived display metrics
// ---------------------------------------------------------------------------

/** Surfer shorthand for a wave-face height in metres. */
function bodyShort(m: number): string {
  if (m < 0.3) return "ankle";
  if (m < 0.5) return "knee";
  if (m < 0.8) return "waist";
  if (m < 1.1) return "chest";
  if (m < 1.5) return "head";
  if (m < 2.2) return "overhead";
  if (m < 3.0) return "well overhead";
  return "double overhead+";
}

/**
 * Surf-height range + body-part label. Surfers read the wave *face*, which sits
 * a little above significant height; the sets run to roughly 1.4x. Returns e.g.
 * { min: 1.2, max: 1.7, label: "chest to head" }.
 */
export function surfHeight(hs: number): {
  min: number;
  max: number;
  label: string;
} {
  const min = round1(hs);
  const max = round1(hs * 1.4);
  const lo = bodyShort(min);
  const hi = bodyShort(max);
  return { min, max, label: lo === hi ? `${lo} high` : `${lo} to ${hi}` };
}

export interface Swell {
  height: number; // m
  period: number; // s
  direction: number; // deg (coming FROM)
  compass: string;
}

/**
 * Swell energy index. Deep-water wave energy flux is proportional to H^2 * T,
 * so we sum that over every swell train and scale it into a readable index
 * (kJ-ish). Bigger, longer-period swells read as more "loaded".
 */
export function swellEnergy(swells: Swell[]): number {
  const e = swells.reduce((sum, s) => sum + s.height * s.height * s.period, 0);
  return Math.round(22 * e);
}

/**
 * Consistency 0-100: how "sets-y" the sea is. One dominant long-period train ->
 * orderly, consistent sets; energy split across trains, or short period ->
 * messy and inconsistent.
 */
export function consistency(swells: Swell[], tp: number): number {
  const energies = swells.map((s) => s.height * s.height * s.period);
  const total = energies.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  const dominance = Math.max(...energies) / total; // 1 = single clean train
  const periodPart = clamp01((tp - 6) / 10); // longer period = more consistent
  return Math.round(100 * (0.6 * dominance + 0.4 * periodPart));
}

// ---------------------------------------------------------------------------
// Tide — derived from the hourly sea-level series
// ---------------------------------------------------------------------------

export interface TideEvent {
  time: string; // ISO local time of the turning point
  height: number; // m relative to mean sea level
  type: "high" | "low";
}

export interface TideInfo {
  state: "rising" | "falling";
  current: number; // current sea-level height, m
  events: TideEvent[]; // upcoming highs/lows (next ~4)
}

/**
 * Find the tide turning points (local maxima/minima of the sea-level series) and
 * whether the tide is rising or falling right now. Resolution is hourly, which
 * is plenty for a "next high at 14:32" style readout.
 */
export function tideInfo(
  times: string[],
  heights: number[],
  nowIndex: number,
): TideInfo {
  const events: TideEvent[] = [];
  for (let i = 1; i < heights.length - 1; i++) {
    const prev = heights[i - 1];
    const cur = heights[i];
    const next = heights[i + 1];
    if (cur > prev && cur >= next) {
      events.push({ time: times[i], height: round1(cur), type: "high" });
    } else if (cur < prev && cur <= next) {
      events.push({ time: times[i], height: round1(cur), type: "low" });
    }
  }
  const now = new Date(times[nowIndex]).getTime();
  const future = events.filter((e) => new Date(e.time).getTime() >= now).slice(0, 4);
  const next = heights[nowIndex + 1] ?? heights[nowIndex];
  return {
    state: next >= heights[nowIndex] ? "rising" : "falling",
    current: round1(heights[nowIndex]),
    events: future.length ? future : events.slice(0, 4),
  };
}

// ---------------------------------------------------------------------------
// Comfort calls: wetsuit (from water temp) + sunscreen (from UV)
// ---------------------------------------------------------------------------

/** Wetsuit recommendation from sea-surface temperature (Celsius). */
export function wetsuit(sst: number): string {
  if (sst >= 24) return "Boardshorts";
  if (sst >= 21) return "Springsuit / 2mm";
  if (sst >= 18) return "3/2 fullsuit";
  if (sst >= 14) return "4/3 + boots";
  if (sst >= 10) return "5/4 + boots & gloves";
  return "6/5 hooded + boots & gloves";
}

/** Sunscreen call from the day's peak UV index. */
export function sunscreen(uv: number): string {
  if (uv < 3) return "Low UV";
  if (uv < 6) return "Use SPF 30";
  if (uv < 8) return "Use SPF 50";
  return "Use SPF 50+, cover up";
}

// ---------------------------------------------------------------------------
// WMO weather codes -> short label (for the weather strip)
// ---------------------------------------------------------------------------

const WEATHER_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm + hail",
  99: "Severe thunderstorm",
};

export function weatherLabel(code: number): string {
  return WEATHER_CODES[code] ?? "—";
}
