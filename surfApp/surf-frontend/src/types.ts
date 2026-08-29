// Shared data shapes used across the app.

// One swell train (primary swell, secondary swell, or the local wind wave).
export interface SwellTrain {
  height: number; // m
  period: number; // s
  direction: number; // deg (coming FROM)
  compass: string; // e.g. "WNW"
}

// A tide turning point.
export interface TideEvent {
  time: string; // ISO local time
  height: number; // m relative to mean sea level
  type: "high" | "low";
}

// Marine forecast for one spot, as returned by /api/forecast.
export interface MarineData {
  current: {
    // headline
    waveHeight: number;
    waveDirection: number;
    wavePeriod: number;
    directionLabel: string;
    score: number; // 0-100 surf-quality score from our model
    rating: string; // FLAT | POOR | FAIR | GOOD | EPIC, derived from score
    parts: { size: number; period: number; swellDir: number; wind: number }; // sub-scores 0-1
    surfHeight: { min: number; max: number; label: string }; // e.g. "chest to head"
    swells: SwellTrain[]; // ranked biggest-first
    energy: number; // swell energy index
    consistency: number; // 0-100
    // wind
    windSpeed: number;
    windGust: number;
    windDirection: number;
    windLabel: string;
    windType: "offshore" | "cross" | "onshore" | null;
    // water / weather / sun
    waterTemp: number;
    wetsuit: string;
    airTemp: number;
    weather: string;
    cloudCover: number;
    uvMax: number;
    sunscreen: string;
    tide: { state: "rising" | "falling"; current: number; events: TideEvent[] };
    sunrise: string;
    sunset: string;
    time: string;
  };
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    sea_level_height_msl: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
  };
  daily: { date: string; waveHeight: number; score: number; rating: string }[];
}

// A surf spot from the DB, enriched with its forecast once loaded.
export interface Spot {
  id: number;
  name: string;
  lat: number;
  lon: number;
  region: string | null;
  description: string | null;
  featured: boolean;
  orientation: number | null;
  data: MarineData | null;
  error: string | null;
}

// Shared state passed from the Layout down to every page via <Outlet context>.
export interface AppOutletContext {
  isLoggedIn: boolean;
  favorites: Set<number>;
  toggle: (spotId: number) => void;
  email: string | null;
  homeRegion: string | null;
  setHomeRegion: (region: string) => void;
}
