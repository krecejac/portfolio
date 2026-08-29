import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { ArrowLeft } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useSpots, useSpotForecast } from "../hooks/useSpots";
import { useCams } from "../hooks/useCams";
import { keyFromRating, RATING } from "../rating";
import type { MarineData, TideEvent } from "../types";
import DirArrow from "../components/DirArrow";

// "07:03" from an Open-Meteo local ISO string like "2026-08-29T07:03".
const hhmm = (iso: string) => iso.slice(11, 16);

export default function SpotDetailPage() {
  // ":id" from the route path "/spot/:id" comes in as a string.
  const { id } = useParams();
  const { spots } = useSpots();
  const spot = spots.find((s) => s.id === Number(id));

  // Fetch this spot's forecast on demand (featured spots hit the shared cache).
  const { data: forecast } = useSpotForecast(spot);

  // Nearest live-video cam, if one is close enough to actually show this break.
  const { data: cams } = useCams(spot);
  const nearCam = cams?.live?.find((c) => c.distanceKm <= 30) ?? null;

  if (!spot) {
    return (
      <main className="mx-auto max-w-page px-8 py-24 text-center font-mono text-sm text-slate-500">
        Loading spot…
        <div className="mt-4">
          <Link to="/" className="text-brand underline">
            Back to the board
          </Link>
        </div>
      </main>
    );
  }

  const current = forecast?.current;
  const key = current ? keyFromRating(current.rating) : null;

  return (
    <main className="mx-auto max-w-page px-8 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-500 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to the board
      </Link>

      {/* hero: map + headline / rating / surf height */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 overflow-hidden rounded-2xl border border-ink/10">
          <MapContainer
            center={[spot.lat, spot.lon]}
            zoom={8}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CircleMarker
              center={[spot.lat, spot.lon]}
              radius={9}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#007fff", fillOpacity: 1 }}
            />
          </MapContainer>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-ink/10 bg-white p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
            {spot.region}
          </p>
          <h1 className="mt-1 font-display text-5xl uppercase tracking-tight text-ink">
            {spot.name}
          </h1>
          {spot.description && (
            <p className="mt-3 leading-relaxed text-slate-600">{spot.description}</p>
          )}

          {key && current ? (
            <>
              <div className="mt-6 flex items-center gap-4">
                <span className={`flex items-center gap-2 font-mono text-sm tracking-[0.12em] ${RATING[key].text}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${RATING[key].dot}`} />
                  {RATING[key].label}
                </span>
                <span className="font-mono text-3xl font-semibold text-ink">
                  {current.score}
                  <span className="text-base text-slate-400">/100</span>
                </span>
              </div>
              {/* surf height headline — the number surfers actually read */}
              <div className="mt-5">
                <p className="font-mono text-5xl font-semibold text-ink">
                  {current.surfHeight.min.toFixed(1)}–{current.surfHeight.max.toFixed(1)}
                  <span className="ml-1 text-xl text-slate-400">m</span>
                </p>
                <p className="mt-1 font-mono text-sm capitalize text-slate-500">
                  {current.surfHeight.label}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 font-mono text-sm text-slate-400">Loading conditions…</p>
          )}
        </div>
      </div>

      {/* condition cards */}
      {current && forecast && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SwellCard current={current} />
          <WindCard current={current} />
          <TideCard forecast={forecast} />
          <WaterWeatherCard current={current} />
          <DaylightCard current={current} />
          <ScoreCard current={current} />
        </div>
      )}

      {/* live cam (only when one is genuinely near this break) */}
      {nearCam && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-8">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rating-poor" />
              Live
            </span>
            <h2 className="font-display text-2xl uppercase tracking-tight text-ink">Cam</h2>
            <span className="font-mono text-xs text-slate-400">
              {nearCam.title} · {nearCam.distanceKm} km away
            </span>
          </div>
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${nearCam.id}?rel=0&autoplay=1&mute=1`}
              title={nearCam.title}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            />
          </div>
        </div>
      )}

      {/* 7-day outlook */}
      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-8">
        <h2 className="font-display text-2xl uppercase tracking-tight text-ink">
          7-day outlook
        </h2>
        {forecast ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {forecast.daily.map((day, d) => {
              const k = keyFromRating(day.rating);
              const label =
                d === 0
                  ? "Today"
                  : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
              return (
                <div key={day.date} className="rounded-xl border border-ink/5 p-4 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 font-mono text-2xl font-semibold text-ink">
                    {day.waveHeight.toFixed(1)}
                    <span className="text-sm text-slate-400">m</span>
                  </p>
                  <span className={`mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] ${RATING[k].text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${RATING[k].dot}`} />
                    {RATING[k].label}
                  </span>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{day.score}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 font-mono text-sm text-slate-400">Loading forecast…</p>
        )}
      </div>
    </main>
  );
}

// --- cards ------------------------------------------------------------------

type Current = MarineData["current"];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SwellCard({ current }: { current: Current }) {
  return (
    <Card title="Swell">
      <div className="space-y-3">
        {current.swells.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-ink">
                {s.height.toFixed(1)}
                <span className="text-sm text-slate-400">m</span>
              </span>
              <span className="font-mono text-sm text-slate-500">{s.period.toFixed(0)}s</span>
              {i === 0 && (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">
                  primary
                </span>
              )}
            </div>
            <span className="flex items-center gap-1.5 font-mono text-sm text-slate-500">
              {s.compass} {s.direction}°
              <DirArrow fromDeg={s.direction} size={16} />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-6 border-t border-ink/5 pt-4">
        <MiniStat label="Energy" value={`${current.energy}`} />
        <MiniStat label="Consistency" value={`${current.consistency}%`} />
      </div>
    </Card>
  );
}

function WindCard({ current }: { current: Current }) {
  const tone =
    current.windType === "offshore"
      ? "text-rating-good bg-rating-good/10"
      : current.windType === "onshore"
        ? "text-rating-poor bg-rating-poor/10"
        : "text-rating-fair bg-rating-fair/10";
  return (
    <Card title="Wind">
      <div className="flex items-end gap-2">
        <span className="font-mono text-4xl font-semibold text-ink">
          {current.windSpeed}
          <span className="text-lg text-slate-400"> km/h</span>
        </span>
        <DirArrow fromDeg={current.windDirection} size={22} />
      </div>
      <p className="mt-1 font-mono text-sm text-slate-500">
        {current.windLabel} · gusts {current.windGust} km/h
      </p>
      {current.windType && (
        <span className={`mt-3 inline-block rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${tone}`}>
          {current.windType}
        </span>
      )}
    </Card>
  );
}

function TideCard({ forecast }: { forecast: MarineData }) {
  const { tide } = forecast.current;
  return (
    <Card title="Tide">
      <TideGraph
        times={forecast.hourly.time}
        levels={forecast.hourly.sea_level_height_msl}
        nowTime={forecast.current.time}
      />
      <p className="mt-2 font-mono text-sm text-slate-500">
        {tide.current.toFixed(1)}m ·{" "}
        <span className={tide.state === "rising" ? "text-rating-good" : "text-slate-500"}>
          {tide.state}
        </span>
      </p>
      <div className="mt-3 space-y-1">
        {tide.events.slice(0, 4).map((e: TideEvent, i) => (
          <div key={i} className="flex justify-between font-mono text-xs text-slate-500">
            <span className="capitalize">{e.type}</span>
            <span>{hhmm(e.time)}</span>
            <span className="text-slate-400">{e.height.toFixed(1)}m</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WaterWeatherCard({ current }: { current: Current }) {
  return (
    <Card title="Water & weather">
      <Row label={`Water · ${current.waterTemp}°C`} value={current.wetsuit} />
      <Row
        label={`Air · ${current.airTemp}°C`}
        value={`${current.weather}, ${current.cloudCover}% cloud`}
      />
      <Row label={`UV · ${current.uvMax}`} value={current.sunscreen} />
    </Card>
  );
}

function DaylightCard({ current }: { current: Current }) {
  return (
    <Card title="Daylight">
      <div className="flex items-end justify-between">
        <MiniStat label="Sunrise" value={hhmm(current.sunrise)} />
        <MiniStat label="Sunset" value={hhmm(current.sunset)} />
      </div>
    </Card>
  );
}

function ScoreCard({ current }: { current: Current }) {
  const p = current.parts;
  return (
    <Card title="Why this score">
      <div className="space-y-3">
        <Bar label="Size" value={p.size} />
        <Bar label="Period" value={p.period} />
        <Bar label="Swell angle" value={p.swellDir} />
        <Bar label="Wind" value={p.wind} />
      </div>
    </Card>
  );
}

// --- little building blocks -------------------------------------------------

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/5 py-2 last:border-0">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="font-mono text-sm text-ink">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-2xl font-semibold text-ink">{value}</span>
      <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
        <span>{label}</span>
        <span>{pct}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// A compact tide sparkline: the sea-level curve for ~a day around now, with a
// dashed "now" marker. preserveAspectRatio=none stretches it to the card width;
// non-scaling strokes keep the line crisp despite the stretch.
function TideGraph({
  times,
  levels,
  nowTime,
}: {
  times: string[];
  levels: number[];
  nowTime: string;
}) {
  let nowIdx = times.indexOf(nowTime);
  if (nowIdx < 0) {
    for (let i = 0; i < times.length; i++) {
      if (times[i] <= nowTime) nowIdx = i;
      else break;
    }
  }
  const start = Math.max(0, nowIdx - 3);
  const win = levels.slice(start, start + 25);
  if (win.length < 2) return null;

  const lo = Math.min(...win);
  const hi = Math.max(...win);
  const span = hi - lo || 1;
  const W = 300;
  const H = 72;
  const pad = 8;
  const x = (i: number) => (i / (win.length - 1)) * W;
  const y = (v: number) => H - pad - ((v - lo) / span) * (H - pad * 2);
  const pts = win.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `M ${x(0)},${H} L ${pts.join(" L ")} L ${x(win.length - 1)},${H} Z`;
  const nowX = x(nowIdx - start);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[72px] w-full">
      <path d={area} className="fill-brand/10" />
      <path
        d={line}
        className="fill-none stroke-brand"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={nowX}
        y1={0}
        x2={nowX}
        y2={H}
        className="stroke-ink/30"
        strokeWidth={1}
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={nowX} cy={y(win[nowIdx - start])} r={3} className="fill-ink" />
    </svg>
  );
}
