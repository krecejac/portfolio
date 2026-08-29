// Wave height -> rating, matching the backend thresholds. Shared so the board,
// the picks carousel and the spot page all label conditions the same way.
export type RatingKey = "flat" | "poor" | "fair" | "good" | "epic";

export function ratingKey(h: number): RatingKey {
  if (h < 0.5) return "flat";
  if (h < 1) return "poor";
  if (h < 1.8) return "fair";
  if (h < 3) return "good";
  return "epic";
}

// Map a backend rating label ("GOOD") back to our lowercase key ("good").
export function keyFromRating(label: string): RatingKey {
  const k = label.toLowerCase();
  return (["flat", "poor", "fair", "good", "epic"].includes(k)
    ? k
    : "flat") as RatingKey;
}

// Raw hex per rating, for places that need a CSS color value rather than a
// Tailwind class (e.g. Leaflet marker fills). Mirrors the theme tokens.
export const RATING_HEX: Record<RatingKey, string> = {
  flat: "#94a3b8",
  poor: "#f43f5e",
  fair: "#fbbf24",
  good: "#34d399",
  epic: "#a78bfa",
};

// Literal class strings so Tailwind keeps them through purge.
export const RATING: Record<RatingKey, { label: string; dot: string; text: string }> = {
  flat: { label: "FLAT", dot: "bg-rating-flat", text: "text-rating-flat" },
  poor: { label: "POOR", dot: "bg-rating-poor", text: "text-rating-poor" },
  fair: { label: "FAIR", dot: "bg-rating-fair", text: "text-rating-fair" },
  good: { label: "GOOD", dot: "bg-rating-good", text: "text-rating-good" },
  epic: { label: "EPIC", dot: "bg-rating-epic", text: "text-rating-epic" },
};
