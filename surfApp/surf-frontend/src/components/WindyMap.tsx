import { useEffect, useRef } from "react";

const KEY = import.meta.env.VITE_WINDY_KEY as string | undefined;

// Windy's Map Forecast API needs Leaflet 1.4.0 + its boot script on the page.
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.4.0/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.4.0/dist/leaflet.js";
const WINDY_JS = "https://api.windy.com/assets/map-forecast/libBoot.js";

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve();
    });
    s.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    document.body.appendChild(s);
  });
}

// Our overlays (wind/temp/pressure) all come from the GFS product, which is what
// the free Map Forecast key allows. (Wave/swell products are premium and get
// silently rejected, so we don't offer them.)
function applyOverlay(api: any, overlay: string) {
  try {
    api.store.set("product", "gfs");
  } catch {
    /* ignore if the product is locked */
  }
  api.store.set("overlay", overlay);
}

// Renders the Windy marine-weather map into a #windy div. Loads its scripts once
// on mount; changing `overlay` swaps the coloured field. onReady hands back the
// Leaflet map so the parent can call invalidateSize() after being shown.
export default function WindyMap({
  overlay,
  onReady,
}: {
  overlay: string;
  onReady?: (map: any) => void;
}) {
  const apiRef = useRef<any>(null);
  const overlayRef = useRef(overlay);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!KEY) return;
      loadCss(LEAFLET_CSS);
      await loadScript(LEAFLET_JS);
      await loadScript(WINDY_JS);
      const windyInit = (window as any).windyInit;
      if (cancelled || typeof windyInit !== "function") return;
      windyInit(
        { key: KEY, verbose: false, lat: 20, lon: 0, zoom: 3 },
        (api: any) => {
          if (cancelled) return;
          apiRef.current = api;
          applyOverlay(api, overlayRef.current);
          onReady?.(api.map);
        },
      );
    }
    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    overlayRef.current = overlay;
    if (apiRef.current) applyOverlay(apiRef.current, overlay);
  }, [overlay]);

  if (!KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-center font-mono text-sm text-slate-500">
        Set VITE_WINDY_KEY in .env.local to enable the marine-weather map.
      </div>
    );
  }

  return <div id="windy" className="h-full w-full" />;
}
