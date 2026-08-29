import { useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useSpots } from "../hooks/useSpots";
import { keyFromRating, RATING } from "../rating";
import DirArrow from "./DirArrow";
import type { Spot } from "../types";

interface TodaysPicksProps {
  favorites: Set<number>;
  canFavorite: boolean;
  onToggleFavorite: (spotId: number) => void;
  homeRegion: string | null;
}

// "-8.815" -> "8.8°S" style label for the coordinate readout.
function coord(value: number, pos: string, neg: string): string {
  const dir = value >= 0 ? pos : neg;
  return `${Math.abs(value).toFixed(1)}°${dir}`;
}

export default function TodaysPicks({
  favorites,
  canFavorite,
  onToggleFavorite,
  homeRegion,
}: TodaysPicksProps) {
  const { spots } = useSpots();
  const [index, setIndex] = useState(0);

  // Featured spots that already have forecast data. Spots in the user's home
  // region come first; within the same group, best conditions win.
  const picks = spots
    .filter((s) => s.featured && s.data)
    .sort((a, b) => {
      const aHome = a.region === homeRegion ? 0 : 1;
      const bHome = b.region === homeRegion ? 0 : 1;
      if (aHome !== bHome) return aHome - bHome;
      return b.data!.current.score - a.data!.current.score;
    });

  const count = picks.length;
  const safe = count ? index % count : 0;
  const pick = count ? picks[safe] : null;

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <section className="mx-auto max-w-page px-8 py-16">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-4xl uppercase tracking-tight text-ink sm:text-5xl">
          Recommended breaks for you
        </h2>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
          Best conditions right now
        </span>
      </div>

      {!pick ? (
        <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-10 text-center font-mono text-sm text-slate-400">
          Loading recommendations…
        </div>
      ) : (
        <div className="relative mt-8">
          <PickCard
            pick={pick}
            isFavorite={favorites.has(pick.id)}
            canFavorite={canFavorite}
            onToggleFavorite={() => onToggleFavorite(pick.id)}
            inHomeRegion={pick.region === homeRegion}
          />

          {/* side arrows */}
          {count > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous spot"
                className="absolute left-3 top-1/2 z-[1000] -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md ring-1 ring-ink/10 transition hover:bg-white"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={next}
                aria-label="Next spot"
                className="absolute right-3 top-1/2 z-[1000] -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md ring-1 ring-ink/10 transition hover:bg-white"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* position dots */}
          {count > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {picks.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to ${p.name}`}
                  className={`h-2 rounded-full transition-all ${
                    i === safe ? "w-6 bg-brand" : "w-2 bg-ink/20 hover:bg-ink/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// One featured spot: map on the left, editorial + live data on the right.
function PickCard({
  pick,
  isFavorite,
  canFavorite,
  onToggleFavorite,
  inHomeRegion,
}: {
  pick: Spot;
  isFavorite: boolean;
  canFavorite: boolean;
  onToggleFavorite: () => void;
  inHomeRegion: boolean;
}) {
  const current = pick.data!.current;
  const key = keyFromRating(current.rating);

  return (
    <div className="relative grid grid-cols-1 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm sm:grid-cols-2">
      {canFavorite && (
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-3 top-3 z-[1000] rounded-full bg-white/90 p-2 text-slate-400 shadow-md ring-1 ring-ink/10 transition hover:text-rating-poor"
        >
          <Heart
            size={18}
            className={isFavorite ? "fill-rating-poor text-rating-poor" : ""}
          />
        </button>
      )}

      {/* map */}
      <div className="h-72 sm:h-full">
        <MapContainer
          key={pick.id}
          center={[pick.lat, pick.lon]}
          zoom={7}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker
            center={[pick.lat, pick.lon]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#007fff", fillOpacity: 1 }}
          />
        </MapContainer>
      </div>

      {/* info */}
      <div className="flex flex-col justify-between gap-6 p-8">
        <div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
              {pick.region}
            </p>
            {inHomeRegion && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand">
                Your region
              </span>
            )}
          </div>
          <Link to={`/spot/${pick.id}`}>
            <h3 className="mt-1 font-display text-4xl uppercase tracking-tight text-ink transition-colors hover:text-brand">
              {pick.name}
            </h3>
          </Link>
          <p className="mt-3 max-w-sm text-slate-600">{pick.description}</p>
          <p className="mt-3 font-mono text-xs text-slate-400">
            {coord(pick.lat, "N", "S")} · {coord(pick.lon, "E", "W")}
          </p>
        </div>

        {/* live data + surf-quality score */}
        <div className="flex items-end gap-8 border-t border-ink/10 pt-5">
          <div className="flex flex-col">
            <span className={`flex items-center gap-2 font-mono text-xs tracking-[0.12em] ${RATING[key].text}`}>
              <span className={`h-2 w-2 rounded-full ${RATING[key].dot}`} />
              {RATING[key].label}
            </span>
            <span className="mt-0.5 font-mono text-2xl font-semibold text-ink">
              {current.score}
              <span className="text-sm text-slate-400">/100</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
              surf score
            </span>
          </div>
          <Metric value={current.waveHeight.toFixed(1)} unit="m" label="swell" />
          <Metric value={current.wavePeriod.toFixed(0)} unit="s" label="period" />
          <Metric
            value={current.windSpeed.toFixed(0)}
            unit="km/h"
            label={`${current.windType ?? "wind"} ${current.windLabel}`}
            arrowDeg={current.windDirection}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  value,
  unit,
  label,
  arrowDeg,
}: {
  value: string;
  unit: string;
  label: string;
  arrowDeg?: number;
}) {
  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-1 font-mono text-2xl font-semibold text-ink">
        <span>
          {value}
          {unit && <span className="ml-0.5 text-sm text-slate-400">{unit}</span>}
        </span>
        {arrowDeg != null && <DirArrow fromDeg={arrowDeg} size={16} />}
      </span>
      <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
    </div>
  );
}
