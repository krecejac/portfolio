import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useCamList } from "../hooks/useCams";

// Camera-icon markers for every live webcam in our catalog, drawn on the spots
// map so you can see at a glance which places have a live cam. Clicking a marker
// opens a popup with a thumbnail and a link to watch the stream. Kept as plain
// markers (only a few hundred) so they stand out from the clustered spot dots.
export default function CamMarkers() {
  const map = useMap();
  const { data: cams = [] } = useCamList();

  useEffect(() => {
    if (!cams.length) return;

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:22px;height:22px;border-radius:50%;background:#0f172a;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:12px">📹</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const layer = L.layerGroup();
    for (const cam of cams) {
      const marker = L.marker([cam.lat, cam.lon], { icon });
      marker.bindPopup(
        `<div style="font-family:sans-serif;width:190px">
           <img src="https://i.ytimg.com/vi/${cam.id}/mqdefault.jpg" alt="" style="width:100%;border-radius:6px;display:block" />
           <div style="font-weight:600;color:#0f172a;margin-top:6px">${cam.title}</div>
           <div style="font:11px monospace;color:#64748b">${cam.place}</div>
           <a href="https://www.youtube.com/watch?v=${cam.id}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font:11px monospace;color:#007fff">Watch live &rarr;</a>
         </div>`,
      );
      layer.addLayer(marker);
    }

    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
  }, [cams, map]);

  return null;
}
