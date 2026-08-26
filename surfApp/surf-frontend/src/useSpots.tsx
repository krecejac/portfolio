// useSpots.ts
import { useState, useEffect } from "react";
import type { Spot } from "./SurfSpot";

// Backend base URL: from VITE_API_URL in production, localhost in dev.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function useSpots() {
  // Start empty: we don't know the list yet, it comes from the backend.
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    // Phase 1: fetch the list of spots from the backend.
    async function load() {
      const listResponse = await fetch(`${API_URL}/api/spots`);
      const list: { name: string; lat: number; lon: number }[] =
        await listResponse.json();

      // Show the cards immediately as empty shells (data/error still null).
      setSpots(list.map((s) => ({ ...s, data: null, error: null })));

      // Phase 2: for each spot, fetch its forecast and fill it in.
      list.forEach(async (spot) => {
        try {
          const response = await fetch(
            `${API_URL}/api/forecast?latitude=${spot.lat}&longitude=${spot.lon}`,
          );
          const result = await response.json();
          setSpots((prev) =>
            prev.map((s) =>
              s.name === spot.name ? { ...s, data: result } : s,
            ),
          );
        } catch (err) {
          setSpots((prev) =>
            prev.map((s) =>
              s.name === spot.name
                ? {
                    ...s,
                    error: err instanceof Error ? err.message : String(err),
                  }
                : s,
            ),
          );
        }
      });
    }

    load();
  }, []);

  function sortByWaveHeight() {
    setSpots((prev) =>
      [...prev].sort((a, b) => {
        const aHeight = a.data?.hourly.wave_height[0] ?? -1;
        const bHeight = b.data?.hourly.wave_height[0] ?? -1;
        return bHeight - aHeight;
      }),
    );
  }

  return { spots, sortByWaveHeight };
}
