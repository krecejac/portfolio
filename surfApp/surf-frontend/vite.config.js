import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Keep a single Leaflet instance across react-leaflet and our own imports.
  // (ClusteredSpots loads leaflet.markercluster from source and binds it to this
  // same instance, so window.L stays free for the Windy map's Leaflet 1.4.x.)
  resolve: { dedupe: ["leaflet"] },
});
