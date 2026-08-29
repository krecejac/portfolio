import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useSpots } from "../hooks/useSpots";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { keyFromRating, RATING } from "../rating";
import DirArrow from "./DirArrow";
import type { Spot } from "../types";

// The spots board: a ranked table of spots with current conditions
// + a 7-day swell trend strip. State only the board needs lives here.
interface SpotsBoardProps {
  favorites: Set<number>;
  canFavorite: boolean;
  onToggleFavorite: (spotId: number) => void;
}

const ROW = "grid grid-cols-[2rem_1fr_6rem_5rem_6rem_8rem_2rem] items-center gap-3";

export default function SpotsBoard({
  favorites,
  canFavorite,
  onToggleFavorite,
}: SpotsBoardProps) {
  const { spots } = useSpots();
  const [searchTerm, setSearchTerm] = useState("");
  // Debounce the query so the filter/sort over thousands of spots only runs once
  // the user pauses, not on every keystroke.
  const query = useDebouncedValue(searchTerm.trim().toLowerCase(), 200);

  // Filter by the query, then rank by surf score (undated spots sink to the
  // bottom). Memoized so toggling a favourite doesn't re-sort the whole catalog.
  const ranked = useMemo(() => {
    const matched = query
      ? spots.filter((s) => s.name.toLowerCase().includes(query))
      : spots;
    return [...matched].sort(
      (a, b) => (b.data?.current.score ?? -1) - (a.data?.current.score ?? -1),
    );
  }, [spots, query]);

  // Cap how many rows render: the top 20 when idle, and up to 50 matches while
  // searching (a broad query like "b" can otherwise match thousands of rows).
  const IDLE_LIMIT = 20;
  const SEARCH_LIMIT = 50;
  const shown = ranked.slice(0, query ? SEARCH_LIMIT : IDLE_LIMIT);
  const hiddenCount = ranked.length - shown.length;

  return (
    <section className="mx-auto max-w-page px-8 py-16">
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-4xl uppercase tracking-tight text-ink sm:text-5xl">
            Today's Board
          </h2>
        </div>

        {/* search */}
        <input
          type="text"
          placeholder="Search for a spot..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6 block w-full max-w-xs rounded-lg border border-slate-300 px-4 py-2 font-mono text-sm focus:border-brand focus:outline-none"
        />

        {/* table (scrolls horizontally on small screens) */}
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* column headers */}
            <div
              className={`${ROW} border-b border-ink/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400`}
            >
              <span>#</span>
              <span>Spot</span>
              <span>Rating</span>
              <span>Swell</span>
              <span>Period·Dir</span>
              <span>7-Day</span>
              <span></span>
            </div>

            {/* rows */}
            {shown.map((spot, i) => (
              <BoardRow
                key={spot.id}
                spot={spot}
                rank={i + 1}
                isFavorite={favorites.has(spot.id)}
                canFavorite={canFavorite}
                onToggleFavorite={() => onToggleFavorite(spot.id)}
              />
            ))}
          </div>
        </div>

        {/* result hint / empty state */}
        {ranked.length === 0 ? (
          <p className="mt-4 font-mono text-xs text-slate-400">
            No spots match "{searchTerm}".
          </p>
        ) : query && hiddenCount > 0 ? (
          <p className="mt-4 font-mono text-xs text-slate-400">
            Showing {shown.length} of {ranked.length} matches. Keep typing to
            narrow it down.
          </p>
        ) : !query && hiddenCount > 0 ? (
          <p className="mt-4 font-mono text-xs text-slate-400">
            Showing top {shown.length} of {ranked.length}. Search to find the
            other {hiddenCount}.
          </p>
        ) : null}
      </div>
    </section>
  );
}

// One row. Kept as a small local component so the map stays readable.
function BoardRow({
  spot,
  rank,
  isFavorite,
  canFavorite,
  onToggleFavorite,
}: {
  spot: Spot;
  rank: number;
  isFavorite: boolean;
  canFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const current = spot.data?.current;
  const key = current ? keyFromRating(current.rating) : null;

  return (
    <div className={`${ROW} border-b border-ink/5 py-4`}>
      <span className="font-mono text-xs text-slate-400">
        {String(rank).padStart(2, "0")}
      </span>

      <div className="flex flex-col">
        <Link
          to={`/spot/${spot.id}`}
          className="font-semibold text-ink hover:text-brand hover:underline"
        >
          {spot.name}
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">
          {spot.region}
        </span>
      </div>

      {key && current ? (
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${RATING[key].dot}`} />
          <span className={`font-mono text-[11px] tracking-[0.12em] ${RATING[key].text}`}>
            {RATING[key].label}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {current.score}
          </span>
        </span>
      ) : (
        <span className="font-mono text-[11px] text-slate-300">—</span>
      )}

      <span className="font-mono text-lg font-semibold text-ink">
        {current ? current.waveHeight.toFixed(1) : "—"}
        <span className="ml-0.5 text-xs text-slate-400">m</span>
      </span>

      <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
        {current ? (
          <>
            {current.wavePeriod.toFixed(0)}s {current.directionLabel}
            <DirArrow fromDeg={current.waveDirection} size={11} />
          </>
        ) : (
          "—"
        )}
      </span>

      {/* 7-day trend strip */}
      <span className="flex gap-1">
        {spot.data
          ? spot.data.daily.map((day, d) => (
              <span
                key={d}
                className={`h-4 w-4 ${RATING[keyFromRating(day.rating)].dot}`}
              />
            ))
          : null}
      </span>

      {canFavorite ? (
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="text-slate-400 transition-colors hover:text-rating-poor"
        >
          <Heart
            size={16}
            className={isFavorite ? "fill-rating-poor text-rating-poor" : ""}
          />
        </button>
      ) : (
        <span></span>
      )}
    </div>
  );
}
