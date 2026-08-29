import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSpots } from "../hooks/useSpots";
import ClusteredSpots from "../components/ClusteredSpots";
import CamMarkers from "../components/CamMarkers";
import WindyMap from "../components/WindyMap";

type Mode = "spots" | "weather";

// Windy weather overlays (the coloured field). Only these GFS overlays are
// available on the free Map Forecast key — wave/swell products are premium and
// get silently rejected, so we don't offer them.
const OVERLAYS: { label: string; id: string }[] = [
  { label: "Wind", id: "wind" },
  { label: "Temp", id: "temp" },
  { label: "Pressure", id: "pressure" },
];

// The Maps page. Two modes: our own spot map (markers coloured by score) and a
// live marine-weather map (wave/wind/swell fields) from the Windy API. Both maps
// stay mounted and are toggled with CSS so Windy only initialises once.
export default function MapsPage() {
  const { spots } = useSpots();
  const [mode, setMode] = useState<Mode>("spots");
  const [overlay, setOverlay] = useState("wind");

  const windyMapRef = useRef<any>(null);
  const spotsMapRef = useRef<LeafletMap | null>(null);
  const prevMode = useRef<Mode>(mode);

  // On mode switch: reveal the target map (a hidden Leaflet map loses its size),
  // and carry the previous map's center/zoom over so the view stays put instead
  // of snapping back to each map's initial position. Windy's api.map is also a
  // Leaflet map, so both expose getCenter/getZoom/setView.
  useEffect(() => {
    const toMap = mode === "weather" ? windyMapRef.current : spotsMapRef.current;
    const fromMap =
      prevMode.current === "weather" ? windyMapRef.current : spotsMapRef.current;
    const changed = prevMode.current !== mode;
    prevMode.current = mode;
    if (!toMap) return;

    const view =
      changed && fromMap
        ? { center: fromMap.getCenter(), zoom: fromMap.getZoom() }
        : null;

    setTimeout(() => {
      toMap.invalidateSize();
      if (view) toMap.setView(view.center, view.zoom, { animate: false });
    }, 100);
  }, [mode]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Spots / Weather toggle */}
      <div className="absolute right-4 top-4 z-[1000] flex overflow-hidden rounded-lg border border-ink/10 bg-white shadow-md">
        {(["spots", "weather"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition ${
              mode === m ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* marine-weather overlay picker (weather mode only) */}
      {mode === "weather" && (
        <div className="absolute left-4 top-4 z-[1000] flex flex-wrap gap-1 rounded-lg border border-ink/10 bg-white p-1 shadow-md">
          {OVERLAYS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOverlay(o.id)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition ${
                overlay === o.id
                  ? "bg-brand text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* weather map (Windy) */}
      <div className={`absolute inset-0 ${mode === "weather" ? "" : "hidden"}`}>
        <WindyMap overlay={overlay} onReady={(map) => (windyMapRef.current = map)} />
      </div>

      {/* spots map (our data) */}
      <div className={`absolute inset-0 ${mode === "spots" ? "" : "hidden"}`}>
        <MapContainer
          center={[20, 10]}
          zoom={2}
          scrollWheelZoom
          className="h-full w-full"
          worldCopyJump
          ref={spotsMapRef}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClusteredSpots spots={spots} />
          <CamMarkers />
        </MapContainer>
      </div>
    </div>
  );
}
