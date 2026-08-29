// Import ocean surf spots from Surfline's public taxonomy API.
//
// Surfline exposes an (unofficial) taxonomy endpoint that walks their geo tree:
//   continent -> country -> region -> subregion -> spot
// Each spot node carries a name and GeoJSON coordinates [lon, lat], and every
// spot is a real, vetted ocean break -- so unlike a raw OpenStreetMap dump we
// get no river waves, pools or surf schools with no marine data.
//
// Cloudflare blocks datacenter IPs, so run this on your own machine:
//   node surf-backend/scripts/import-surfline.mjs
//
// It writes two files next to the SQL seeds:
//   sql/world-spots.sql   -- ready to psql into the spots table
//   scripts/surfline.json -- the raw collected spots (handy for debugging)
//
// The SQL uses ON CONFLICT (name) DO NOTHING, so it never touches your 63
// curated "featured" spots -- it only fills in the rest of the world.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT_ID = "58f7ed51dadb30820bb38782"; // "Earth"
const BASE = "https://services.surfline.com/taxonomy";

// Map Surfline continents onto the app's REGIONS (see surf-frontend/src/regions.ts).
// Unmapped continents fall back to their own name.
const REGION_MAP = {
  Europe: "Europe",
  "North America": "North America",
  "Central America": "Central America",
  "South America": "Central America", // app has no South America bucket; nearest fit
  Africa: "Africa",
  Asia: "Asia",
  Oceania: "Oceania & Pacific",
  Australia: "Oceania & Pacific",
  "Australia/Oceania": "Oceania & Pacific",
};

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.surfline.com/",
};

// Fetch one taxonomy node and its descendants up to `maxDepth` (Surfline caps at 5).
async function fetchNode(id, maxDepth) {
  const url = `${BASE}?type=taxonomy&id=${id}&maxDepth=${maxDepth}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`);
  return res.json();
}

// A taxonomy response is a node with `contains` (children). We recurse, carrying
// the continent name down so every spot inherits its region.
function collectSpots(node, continent, out) {
  if (!node) return;
  const nextContinent = node.type === "continent" ? node.name : continent;

  if (node.type === "spot" && node.location?.coordinates) {
    const [lon, lat] = node.location.coordinates;
    if (typeof lat === "number" && typeof lon === "number") {
      out.push({
        name: node.name,
        lat: Number(lat.toFixed(4)),
        lon: Number(lon.toFixed(4)),
        region: REGION_MAP[nextContinent] ?? nextContinent ?? "Unknown",
      });
    }
  }

  for (const child of node.contains ?? []) {
    collectSpots(child, nextContinent, out);
  }
}

// Some branches are deeper than one maxDepth=5 call can reach. When a returned
// node still has children we haven't drilled into (a country/region with no
// spots yet in the payload), refetch it. We de-dupe visited ids to stay cheap.
async function walk(id, maxDepth, continent, out, seen) {
  if (seen.has(id)) return;
  seen.add(id);

  let node;
  try {
    node = await fetchNode(id, maxDepth);
  } catch (err) {
    console.warn(`  skip ${id}: ${err.message}`);
    return;
  }

  collectSpots(node, continent, out);

  // Re-drill any non-spot leaf that could still hold spots below our depth.
  const frontier = [];
  const scan = (n, cont) => {
    const c = n.type === "continent" ? n.name : cont;
    const kids = n.contains ?? [];
    if (kids.length === 0 && n.type !== "spot" && n.hasSpots) {
      frontier.push({ id: n._id, continent: c });
    }
    for (const k of kids) scan(k, c);
  };
  scan(node, continent);

  for (const f of frontier) {
    await walk(f.id, maxDepth, f.continent, out, seen);
  }
}

async function main() {
  console.log("Fetching Surfline taxonomy (this makes several requests)...");
  const spots = [];
  const seen = new Set();

  // Start from Earth and drill the whole tree.
  await walk(ROOT_ID, 5, null, spots, seen);

  // De-dupe by name (keep first); Surfline occasionally repeats break names.
  const byName = new Map();
  for (const s of spots) if (!byName.has(s.name)) byName.set(s.name, s);
  const unique = [...byName.values()].sort((a, b) =>
    a.region.localeCompare(b.region) || a.name.localeCompare(b.name),
  );

  console.log(`Collected ${spots.length} spots, ${unique.length} unique.`);

  const here = dirname(fileURLToPath(import.meta.url));
  const jsonPath = resolve(here, "surfline.json");
  const sqlPath = resolve(here, "..", "sql", "world-spots.sql");

  await writeFile(jsonPath, JSON.stringify(unique, null, 2));

  const esc = (s) => s.replace(/'/g, "''");
  const values = unique
    .map(
      (s) =>
        `  ('${esc(s.name)}', ${s.lat}, ${s.lon}, '${esc(s.region)}', false)`,
    )
    .join(",\n");

  const sql = `-- Auto-imported ocean surf spots from Surfline taxonomy.
-- Generated by scripts/import-surfline.mjs -- do not edit by hand; re-run instead.
-- ON CONFLICT (name) DO NOTHING keeps your curated "featured" spots untouched.

INSERT INTO spots (name, lat, lon, region, featured) VALUES
${values}
ON CONFLICT (name) DO NOTHING;
`;

  await writeFile(sqlPath, sql);
  console.log(`Wrote ${sqlPath}`);
  console.log(`Wrote ${jsonPath}`);
  console.log("\nNext: psql \"$DATABASE_URL\" -f surf-backend/sql/world-spots.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
