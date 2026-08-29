// Coarse regions used for the profile preference and to bias "Recommended".
export const REGIONS = [
  "Europe",
  "North America",
  "Central America",
  "Africa",
  "Asia",
  "Oceania & Pacific",
] as const;

// Which region each famous spot belongs to (keyed by its exact DB name).
export const REGION_OF: Record<string, string> = {
  Hossegor: "Europe",
  Mundaka: "Europe",
  Mavericks: "North America",
  Trestles: "North America",
  "Puerto Escondido": "Central America",
  "Jeffreys Bay": "Africa",
  "Uluwatu (Bali)": "Asia",
  "Pipeline (Oahu)": "Oceania & Pacific",
  "Teahupo'o (Tahiti)": "Oceania & Pacific",
  "Cloudbreak (Fiji)": "Oceania & Pacific",
  "Bells Beach": "Oceania & Pacific",
  "Superbank (Snapper)": "Oceania & Pacific",
};
