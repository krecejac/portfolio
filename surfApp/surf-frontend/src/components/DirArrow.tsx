import { ArrowUp } from "lucide-react";

// A small arrow pointing the way wind/swell is TRAVELLING. Meteorological
// directions are "coming from", so the arrow rotates to fromDeg + 180.
// ArrowUp points north (0deg) by default.
export default function DirArrow({
  fromDeg,
  size = 14,
}: {
  fromDeg: number;
  size?: number;
}) {
  return (
    <ArrowUp
      size={size}
      className="inline-block shrink-0 text-slate-400"
      style={{ transform: `rotate(${(fromDeg + 180) % 360}deg)` }}
      aria-hidden
    />
  );
}
