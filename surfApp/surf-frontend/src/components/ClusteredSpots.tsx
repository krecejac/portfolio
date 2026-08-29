import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// Load the plugin as source text (not as a module) so we can run it against our
// OWN imported Leaflet instead of the global window.L. The Windy map needs
// window.L to be Leaflet 1.4.x, so we must not clobber it with our 1.9.x here.
import clusterSource from "leaflet.markercluster/dist/leaflet.markercluster.js?raw";
import { keyFromRating, RATING_HEX } from "../rating";
import type { Spot } from "../types";

type ClusterFactory = (opts?: Record<string, unknown>) => L.FeatureGroup;

// leaflet.markercluster attaches L.MarkerClusterGroup via a free `L` variable.
// Running its source through `new Function("L", src)(L)` binds that free `L` to
// our imported instance, augmenting it (and its captured closure) without ever
// touching window.L. Runs once; the augmentation persists on the L singleton.
function ensureClusterPlugin(): ClusterFactory | undefined {
  const withCluster = L as unknown as { markerClusterGroup?: ClusterFactory };
  if (!withCluster.markerClusterGroup) {
    new Function("L", clusterSource)(L);
  }
  return withCluster.markerClusterGroup;
}

// Renders the whole catalog (thousands of spots) with marker clustering so
// zoomed-out views stay smooth. Featured/curated spots (with loaded forecasts)
// are coloured by rating; the rest are neutral until you open them.
export default function ClusteredSpots({ spots }: { spots: Spot[] }) {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    if (!spots.length) return;

    const markerClusterGroup = ensureClusterPlugin();
    if (!markerClusterGroup) return; // plugin failed to load; skip clustering

    const group = markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
    });

    for (const spot of spots) {
      const key = spot.data ? keyFromRating(spot.data.current.rating) : null;
      const color = key ? RATING_HEX[key] : "#94a3b8";
      const marker = L.circleMarker([spot.lat, spot.lon], {
        radius: 5,
        color: "#ffffff",
        weight: 1,
        fillColor: color,
        fillOpacity: 1,
      });

      const score = spot.data ? `${spot.data.current.score}/100` : "";
      marker.bindPopup(
        `<div style="font-family:sans-serif;min-width:120px">
           <div style="font:600 10px/1.4 monospace;letter-spacing:.12em;text-transform:uppercase;color:#64748b">${spot.region ?? ""}</div>
           <div style="font-weight:600;color:#0f172a">${spot.name}</div>
           ${score ? `<div style="font:11px monospace;color:#64748b;margin-top:2px">${score}</div>` : ""}
           <a data-spot="${spot.id}" href="/spot/${spot.id}" style="display:inline-block;margin-top:4px;font:11px monospace;color:#007fff">View spot &rarr;</a>
         </div>`,
      );
      group.addLayer(marker);
    }

    // Popups render outside React, so wire their link back into the router.
    group.on("popupopen", (e: L.LeafletEvent) => {
      const el = (e as L.PopupEvent).popup.getElement();
      const link = el?.querySelector<HTMLAnchorElement>("a[data-spot]");
      link?.addEventListener("click", (ev) => {
        ev.preventDefault();
        navigate(`/spot/${link.dataset.spot}`);
      });
    });

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [spots, map, navigate]);

  return null;
}
