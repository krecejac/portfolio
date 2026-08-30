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

// Windy's Map Forecast API is a page-global singleton: `windyInit` must run
// EXACTLY once per page load, and it renders into a single #windy element.
// Re-running it on a remount (leave /maps and come back) spawns a second WebGL
// context on the stale canvas, which corrupts it and the map goes blank. So we
// boot Windy once, keep the initialised map + its container div at module scope,
// and just re-parent that same div into whichever WindyMap is currently mounted.
type WindySingleton = { container: HTMLDivElement; api: any };
let windyReady: Promise<WindySingleton> | null = null;

function ensureWindy(): Promise<WindySingleton> {
  if (windyReady) return windyReady;
  windyReady = (async () => {
    loadCss(LEAFLET_CSS);
    await loadScript(LEAFLET_JS);
    await loadScript(WINDY_JS);
    const windyInit = (window as any).windyInit;
    // The one and only #windy element. It lives outside React's control so a
    // remount never recreates it; parked on <body> until a component claims it.
    const container = document.createElement("div");
    container.id = "windy";
    container.className = "h-full w-full";
    document.body.appendChild(container);
    const api = await new Promise<any>((resolve) => {
      windyInit({ key: KEY, verbose: false, lat: 20, lon: 0, zoom: 3 }, resolve);
    });
    return { container, api };
  })();
  return windyReady;
}

// Renders the Windy marine-weather map. The heavy Windy instance is booted once
// (see ensureWindy) and shared; this component just claims its div on mount and
// hands it back on unmount. Changing `overlay` swaps the coloured field; onReady
// hands back the Leaflet map so the parent can invalidateSize() after showing it.
export default function WindyMap({
  overlay,
  onReady,
}: {
  overlay: string;
  onReady?: (map: any) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  useEffect(() => {
    if (!KEY) return;
    let cancelled = false;
    let claimed: HTMLDivElement | null = null;

    ensureWindy().then(({ container, api }) => {
      if (cancelled || !hostRef.current) return;
      claimed = container;
      // appendChild MOVES the div here if it was mounted elsewhere before.
      hostRef.current.appendChild(container);
      applyOverlay(api, overlayRef.current);
      onReady?.(api.map);
      // The map may have been hidden (zero-size) until now — force a relayout.
      setTimeout(() => api.map.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      // Detach (don't destroy) the div so React can cleanly remove our host and
      // the next mount can re-attach the same, already-initialised map.
      if (claimed?.parentNode) claimed.parentNode.removeChild(claimed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    overlayRef.current = overlay;
    windyReady?.then(({ api }) => applyOverlay(api, overlay));
  }, [overlay]);

  if (!KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-center font-mono text-sm text-slate-500">
        Set VITE_WINDY_KEY in .env.local to enable the marine-weather map.
      </div>
    );
  }

  return <div ref={hostRef} className="h-full w-full" />;
}
