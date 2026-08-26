import { Loader2 } from "lucide-react";

interface MarineData {
  current: {
    waveHeight: number;
    waveDirection: number;
    wavePeriod: number;
    directionLabel: string;
    rating: string;
  };
  hourly: {
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
  };
}

export interface Spot {
  name: string;
  lat: number;
  lon: number;
  data: MarineData | null;
  error: string | null;
}

interface SurfSpotProps {
  spot: Spot;
}

const RATING_COLORS: Record<string, { dot: string; text: string }> = {
  FLAT: { dot: "bg-slate-400", text: "text-slate-400" },
  POOR: { dot: "bg-rose-500", text: "text-rose-400" },
  FAIR: { dot: "bg-amber-400", text: "text-amber-300" },
  GOOD: { dot: "bg-emerald-400", text: "text-emerald-300" },
  EPIC: { dot: "bg-violet-400", text: "text-violet-300" },
};

function Metric({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-white">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className="ml-0.5 text-sm text-slate-400">{unit}</span>
      </div>
      <span className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
}

function SurfSpot({ spot }: SurfSpotProps) {
  if (spot.error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-slate-900 px-5 py-4 text-rose-300">
        Nepodařilo se načíst {spot.name}
      </div>
    );
  }

  if (!spot.data) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-4 text-slate-500">
        <Loader2 className="animate-spin" size={18} />
        Načítám {spot.name}…
      </div>
    );
  }

  const { waveHeight, wavePeriod, directionLabel, rating } = spot.data.current;
  const colors = RATING_COLORS[rating];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-4 shadow-lg transition-colors hover:border-slate-500">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
          {spot.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
          <span className={`text-xs font-bold tracking-wider ${colors.text}`}>
            {rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-4">
        <Metric value={waveHeight.toFixed(1)} unit="m" label="swell" />
        <Metric value={wavePeriod.toFixed(0)} unit="s" label="period" />
        <Metric value={directionLabel} unit="" label="dir" />
      </div>
    </div>
  );
}

export default SurfSpot;
