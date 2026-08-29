// Data layer for spots + forecasts, backed by React Query.
//
// The catalog now holds thousands of spots, so we can't fetch a forecast for
// every one. Instead:
//   - the spot LIST is fetched once and cached (names, coords, region, ...),
//   - forecasts are fetched only for FEATURED spots (home page + ranking),
//   - any other spot's forecast is fetched on demand via useSpotForecast()
//     when its detail page opens.
// React Query keys every forecast by spot id, so each is fetched at most once
// and shared across the board, picks, map and detail page.

import { useQuery, useQueries } from "@tanstack/react-query";
import type { MarineData, Spot } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// A spot before its forecast is attached — exactly what /api/spots returns.
export type SpotMeta = Omit<Spot, "data" | "error">;

async function fetchSpotsList(): Promise<SpotMeta[]> {
  const res = await fetch(`${API_URL}/api/spots`);
  if (!res.ok) throw new Error(`spots list: HTTP ${res.status}`);
  return res.json();
}

async function fetchForecast(spot: SpotMeta): Promise<MarineData> {
  // Pass orientation so the model can judge offshore/onshore wind, and the spot
  // id so the backend can cache the computed snapshot per spot in the database.
  const orientationParam =
    spot.orientation != null ? `&orientation=${spot.orientation}` : "";
  const res = await fetch(
    `${API_URL}/api/forecast?latitude=${spot.lat}&longitude=${spot.lon}&id=${spot.id}${orientationParam}`,
  );
  if (!res.ok) throw new Error(`forecast: HTTP ${res.status}`);
  return res.json();
}

// The whole catalog, with forecast data filled in for featured spots only.
// Non-featured spots come back with data: null (loaded on demand elsewhere).
export function useSpots() {
  const listQuery = useQuery({
    queryKey: ["spots"],
    queryFn: fetchSpotsList,
    staleTime: Infinity, // the catalog rarely changes within a session
  });

  const list = listQuery.data ?? [];

  // Eager-load forecasts for the CURATED spots only (the ~60 hand-picked breaks,
  // identified by having a description). The thousands of imported world spots
  // have no description and stay lazy — their forecast loads on demand when the
  // detail page opens. React Query dedupes each by ["forecast", id].
  const curated = list.filter((s) => s.description != null);

  const forecastQueries = useQueries({
    queries: curated.map((spot) => ({
      queryKey: ["forecast", spot.id],
      queryFn: () => fetchForecast(spot),
    })),
  });

  const dataById = new Map<number, MarineData | null>();
  curated.forEach((spot, i) => {
    dataById.set(spot.id, forecastQueries[i]?.data ?? null);
  });

  const spots: Spot[] = list.map((s) => ({
    ...s,
    data: dataById.get(s.id) ?? null,
    error: null,
  }));

  return {
    spots,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
  };
}

// Load one spot's forecast on demand (used by the detail page). Shares the same
// cache key as the featured forecasts above, so opening a featured spot is free.
export function useSpotForecast(spot: SpotMeta | undefined) {
  return useQuery({
    queryKey: ["forecast", spot?.id],
    queryFn: () => fetchForecast(spot!),
    enabled: !!spot,
  });
}
