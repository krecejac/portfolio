import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Video, X } from "lucide-react";
import { useSpots, useSpotForecast } from "../hooks/useSpots";
import { useCams, useCamList, type Cam } from "../hooks/useCams";
import { LIVE_TV } from "../cams-live";
import { keyFromRating, RATING } from "../rating";
import type { AppOutletContext, Spot } from "../types";

// A YouTube stream to open in the modal player (used by both the per-spot live
// cams and the browsable "Live webcams" grid).
interface YtPlay {
  id: string;
  title: string;
  subtitle: string;
}

const PAGE = 12; // how many grid cams to reveal per "load more"

// Preferred order for the region filter chips; any others follow.
const REGION_ORDER = [
  "Europe",
  "North America",
  "Central America",
  "Caribbean & Central America",
  "South America",
  "Oceania & Pacific",
  "Asia",
  "Africa",
];

// Cams & Forecast: search any spot for its conditions + nearby cams, and browse
// a big catalog of live webcams worldwide.
export default function CamsPage() {
  const { homeRegion } = useOutletContext<AppOutletContext>();
  const { spots } = useSpots();

  // Featured breaks (home region first) drive the default spot + suggestions.
  const featured = useMemo(() => {
    return spots
      .filter((s) => s.featured)
      .sort((a, b) => {
        const ah = a.region === homeRegion ? 0 : 1;
        const bh = b.region === homeRegion ? 0 : 1;
        if (ah !== bh) return ah - bh;
        return a.name.localeCompare(b.name);
      });
  }, [spots, homeRegion]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const spot = spots.find((s) => s.id === selectedId) ?? featured[0];

  // Searchable spot picker over the WHOLE catalog so every beach is reachable.
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return featured.slice(0, 8);
    return spots.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 20);
  }, [query, spots, featured]);

  const { data: forecast } = useSpotForecast(spot);
  const { data: cams, isLoading } = useCams(spot);

  const [active, setActive] = useState<Cam | null>(null);
  const [yt, setYt] = useState<YtPlay | null>(null);

  const liveCams = cams?.live ?? [];
  const timelapseCams = cams?.timelapse ?? [];

  const current = forecast?.current;
  const key = current ? keyFromRating(current.rating) : null;

  // Featured hero = Surfline's global 24/7 stream.
  const hero = LIVE_TV.find((t) => t.provider === "Surfline") ?? LIVE_TV[0];

  // Browsable catalog of live webcams, filtered by region + revealed in pages.
  const { data: camList = [] } = useCamList();
  const [region, setRegion] = useState("All");
  const [visible, setVisible] = useState(PAGE);
  const regions = useMemo(() => {
    const present = new Set(camList.map((c) => c.region));
    const ordered = REGION_ORDER.filter((r) => present.has(r));
    const extra = [...present].filter((r) => !REGION_ORDER.includes(r)).sort();
    return ["All", ...ordered, ...extra];
  }, [camList]);
  const filtered = useMemo(
    () => (region === "All" ? camList : camList.filter((c) => c.region === region)),
    [camList, region],
  );
  const shown = filtered.slice(0, visible);

  function pick(s: Spot) {
    setSelectedId(s.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <main className="mx-auto max-w-page px-8 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
        Cams &amp; Forecast
      </p>
      <h1 className="mt-2 font-display text-5xl uppercase tracking-tight text-ink sm:text-6xl">
        Live from the coast
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
        Search any break to see its current conditions and any cams nearby.
        Eyeball the water before you paddle out.
      </p>

      {/* spot search + conditions strip */}
      <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-ink/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {spot?.region ?? "Spot"}
          </p>
          <h2 className="mt-0.5 font-display text-3xl uppercase tracking-tight text-ink">
            {spot?.name ?? "Pick a spot"}
          </h2>

          <div className="relative mt-3 w-full sm:w-80">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search all spots…"
              className="w-full rounded-lg border border-ink/15 bg-white py-2 pl-9 pr-3 font-mono text-sm text-ink focus:border-brand focus:outline-none"
            />
            {open && matches.length > 0 && (
              <ul className="absolute z-[1200] mt-1 max-h-72 w-full overflow-auto rounded-lg border border-ink/10 bg-white py-1 shadow-lg">
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(s)}
                      className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <span className="truncate font-medium text-ink">
                        {s.name}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                        {s.region}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {key && current ? (
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-2 font-mono text-sm tracking-[0.12em] ${RATING[key].text}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${RATING[key].dot}`} />
                {RATING[key].label}
              </span>
              <span className="font-mono text-3xl font-semibold text-ink">
                {current.score}
                <span className="text-base text-slate-400">/100</span>
              </span>
            </div>
            <Stat value={current.waveHeight.toFixed(1)} unit="m" label="swell" />
            <Stat value={current.wavePeriod.toFixed(0)} unit="s" label="period" />
            <Stat
              value={current.windSpeed.toFixed(0)}
              unit="km/h"
              label={`${current.windType ?? "wind"} ${current.windLabel}`}
            />
          </div>
        ) : (
          <p className="font-mono text-sm text-slate-400">Loading conditions…</p>
        )}
      </div>

      {isLoading && (
        <p className="mt-8 font-mono text-sm text-slate-400">Looking for cams…</p>
      )}

      {/* Live video cams near the spot (real YouTube streams from our catalog) */}
      {!isLoading && liveCams.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
            Live video near {spot?.name}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {liveCams.map((cam) => (
              <CamCard
                key={cam.id}
                youtubeId={cam.id}
                title={cam.title}
                place={cam.place}
                badge={`Live · ${cam.distanceKm} km away`}
                live
                onClick={() =>
                  setYt({
                    id: cam.id,
                    title: cam.title,
                    subtitle: `${cam.place} · ${cam.distanceKm} km away`,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Windy timelapse webcams near the spot (periodic snapshots) */}
      {!isLoading && timelapseCams.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
            Timelapse webcams near {spot?.name}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {timelapseCams.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setActive(cam)}
                className="group overflow-hidden rounded-2xl border border-ink/10 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {cam.preview ? (
                    <img
                      src={cam.preview}
                      alt={cam.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Video className="text-slate-300" size={28} />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                    Timelapse
                    {cam.distanceKm != null && (
                      <span className="text-white/70">
                        · {cam.distanceKm} km away
                      </span>
                    )}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-display text-lg uppercase tracking-tight text-ink">
                    {cam.title}
                  </h3>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                    {cam.place || " "}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* nothing nearby */}
      {!isLoading && liveCams.length === 0 && timelapseCams.length === 0 && (
        <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-8 text-center">
          <Video className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 font-mono text-sm text-slate-500">
            No cams within 150 km of {spot?.name} — it&apos;s a remote break.
            Browse the live webcams below, or try another spot.
          </p>
        </div>
      )}

      {/* Featured: Surfline global stream + a browsable catalog of live webcams */}
      <section className="mt-14 border-t border-ink/10 pt-10">
        {hero && (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rating-poor" />
                Live
              </span>
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
                Surf TV — {hero.title} · {hero.provider}
              </h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-black">
              <div className="aspect-video w-full">
                <iframe
                  key={hero.id}
                  src={`https://www.youtube.com/embed/${hero.id}?rel=0&autoplay=1&mute=1`}
                  title={hero.title}
                  className="h-full w-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                />
              </div>
            </div>
          </>
        )}

        {/* browsable catalog */}
        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-3xl uppercase tracking-tight text-ink">
            Live webcams
          </h2>
          <p className="font-mono text-xs text-slate-500">
            {filtered.length} streams
            {region !== "All" ? ` in ${region}` : " worldwide"}
          </p>
        </div>

        {/* region filter chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRegion(r);
                setVisible(PAGE);
              }}
              className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition ${
                r === region
                  ? "bg-brand text-white"
                  : "border border-ink/10 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((cam) => (
            <CamCard
              key={cam.id}
              youtubeId={cam.id}
              title={cam.title}
              place={cam.place}
              badge="Live"
              live
              onClick={() =>
                setYt({ id: cam.id, title: cam.title, subtitle: cam.place })
              }
            />
          ))}
        </div>

        {shown.length < filtered.length && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setVisible((v) => v + PAGE)}
              className="rounded-lg border border-ink/15 bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50"
            >
              Load more ({filtered.length - shown.length} more)
            </button>
          </div>
        )}
      </section>

      {/* YouTube modal (per-spot live cams + catalog) */}
      {yt && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setYt(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl uppercase tracking-tight text-ink">
                  {yt.title}
                </h3>
                <p className="truncate font-mono text-xs text-slate-500">
                  {yt.subtitle}
                </p>
              </div>
              <button
                onClick={() => setYt(null)}
                className="ml-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                key={yt.id}
                src={`https://www.youtube.com/embed/${yt.id}?rel=0&autoplay=1&mute=1`}
                title={yt.title}
                className="h-full w-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timelapse modal (Windy) */}
      {active && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl uppercase tracking-tight text-ink">
                  {active.title}
                </h3>
                <p className="truncate font-mono text-xs text-slate-500">
                  {active.place}
                </p>
              </div>
              <button
                onClick={() => setActive(null)}
                className="ml-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {active.embedLive ?? active.embedDay ? (
                <iframe
                  key={active.id}
                  src={active.embedLive ?? active.embedDay ?? undefined}
                  title={active.title}
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-8 text-center font-mono text-sm text-slate-400">
                  This cam has no embeddable stream.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// A YouTube-thumbnail cam card (used for per-spot live cams and the catalog).
function CamCard({
  youtubeId,
  title,
  place,
  badge,
  live,
  onClick,
}: {
  youtubeId: string;
  title: string;
  place: string;
  badge: string;
  live?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-ink/10 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        <img
          src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
          {live && <span className="h-1.5 w-1.5 rounded-full bg-rating-poor" />}
          {badge}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-display text-lg uppercase tracking-tight text-ink">
          {title}
        </h3>
        <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
          {place || " "}
        </p>
      </div>
    </button>
  );
}

function Stat({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-2xl font-semibold text-ink">
        {value}
        {unit && <span className="ml-0.5 text-sm text-slate-400">{unit}</span>}
      </span>
      <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
    </div>
  );
}
