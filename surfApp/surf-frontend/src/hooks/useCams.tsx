// Cams near a spot, from our backend. Two sources:
//   live      = real YouTube video streams (from our harvested `cams` table)
//   timelapse = Windy webcams (periodic snapshots)
// Cached by spot id via React Query so switching spots back and forth is free.

import { useQuery } from "@tanstack/react-query";
import type { SpotMeta } from "./useSpots";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// A real live-video cam — embed by YouTube id.
export interface LiveCam {
  id: string; // YouTube video id
  title: string;
  place: string;
  distanceKm: number;
}

// A Windy timelapse cam (periodic snapshots stitched into a player).
export interface Cam {
  id: number;
  title: string;
  place: string;
  distanceKm: number | null;
  preview: string | null;
  embedLive: string | null;
  embedDay: string | null;
}

export interface CamsResult {
  live: LiveCam[];
  timelapse: Cam[];
}

async function fetchCams(spot: SpotMeta): Promise<CamsResult> {
  const res = await fetch(`${API_URL}/api/cams?lat=${spot.lat}&lon=${spot.lon}`);
  if (!res.ok) throw new Error(`cams: HTTP ${res.status}`);
  const body = (await res.json()) as Partial<CamsResult>;
  return { live: body.live ?? [], timelapse: body.timelapse ?? [] };
}

export function useCams(spot: SpotMeta | undefined) {
  return useQuery({
    queryKey: ["cams", spot?.id],
    queryFn: () => fetchCams(spot!),
    enabled: !!spot,
    staleTime: 6 * 60 * 60 * 1000, // matches the backend cache
  });
}

// One entry in the global live-webcam catalog (for the browsable grid + map).
export interface CamListItem {
  id: string; // YouTube video id
  title: string;
  place: string;
  region: string;
  lat: number;
  lon: number;
}

async function fetchCamList(): Promise<CamListItem[]> {
  const res = await fetch(`${API_URL}/api/cams/list`);
  if (!res.ok) throw new Error(`cam list: HTTP ${res.status}`);
  const body = (await res.json()) as { cams: CamListItem[] };
  return body.cams;
}

// The whole webcam catalog, fetched once and cached (used by the browsable
// "Live webcams" grid, filtered by region client-side).
export function useCamList() {
  return useQuery({
    queryKey: ["cam-list"],
    queryFn: fetchCamList,
    staleTime: Infinity,
  });
}
