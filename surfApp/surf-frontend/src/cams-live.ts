// Curated 24/7 live surf/beach streams on YouTube — real, continuous motion
// video, unlike the Windy webcams (periodic snapshots stitched into a timelapse).
// We embed by video id. These are long-running broadcasts; if one ever ends,
// swap its id here. Each was verified as live + embeddable
// (playabilityStatus.playableInEmbed === true) via the YouTube player API.
export interface LiveTv {
  id: string; // YouTube video id
  title: string; // short spot label
  place: string; // where it is
  provider: string; // who runs the stream
  region: string; // for the region filter on the Cams page
}

export const LIVE_TV: LiveTv[] = [
  { id: "hm9iAviOZ20", title: "Surf Cams 24/7", place: "Worldwide · rotating", provider: "Surfline", region: "Worldwide" },
  { id: "Fp7l8XASb9Y", title: "Banzai Pipeline", place: "North Shore, Oahu", provider: "explore.org", region: "Oceania & Pacific" },
  { id: "JE3EvN55hfE", title: "Campus Point", place: "Santa Barbara, CA", provider: "GRIT", region: "North America" },
  { id: "r9PwbZwEFas", title: "Galveston Seawall", place: "Texas, USA", provider: "Galveston TV", region: "North America" },
  { id: "Cbp3Wg44fPo", title: "Scheveningen", place: "Netherlands", provider: "Hart Beach", region: "Europe" },
  { id: "kiOefBj8Ju4", title: "Sylt · Westerland", place: "Germany", provider: "Surfcam Sylt", region: "Europe" },
  { id: "T83mKGf_c3k", title: "St Ives Harbour", place: "Cornwall, UK", provider: "Aspects", region: "Europe" },
  { id: "kkVrj2cr9Ko", title: "Lamai Beach", place: "Koh Samui, Thailand", provider: "Crystal Bay", region: "Asia" },
  { id: "eVwrik4YkFg", title: "Bonny Hills Beach", place: "NSW, Australia", provider: "Bonny Hills", region: "Oceania & Pacific" },
  { id: "iSeH45R-8R0", title: "Maho Beach", place: "Sint Maarten, Caribbean", provider: "SHOWME", region: "Central America" },
  { id: "Thtj8Ht7Z_c", title: "Seychelles Ocean", place: "Indian Ocean", provider: "Luxury Island", region: "Africa" },
];
