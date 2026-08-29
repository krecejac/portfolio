# SWELL — Landing wireframe & design notes

Low-fi plan for the landing page and the design language behind it.
Kept intentionally rough — decisions over pixels. Feeds the README later.

## Concept

A surf-report app with the look of a proper forecast desk (data-dense,
engineered) but a lighter, playful skin — not a dark surfline clone.
Focus: well-known surf spots worldwide, live conditions from Open-Meteo Marine.

## Design language

- **Type:** playful display face for headlines (TBD) + **IBM Plex Mono**
  for labels / numbers / data. The mono is what gives it the "report" feel.
- **Navbar:** white, stays as-is.
- **Not dark overall** — light, characterful ground (reuse the `bg.svg`
  wave motif behind sections), dark used only sparingly (cards, footer).
- **Brand blue** `#007FFF`. Rating scale FLAT → POOR → FAIR → GOOD → EPIC.
- Stat treatment (big number + mono unit + mono caption) borrowed from the
  Claude Design mockups — reused in cards/board, NOT as a strip on the hero.

## Landing — top to bottom

```
┌──────────────────────────────────────────────────────────┐
│  [WHITE NAVBAR]                                            │
│  SWELL        Cams & Forecast  Learn  About      Sign In   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│              [ FULL-BLEED SURF VIDEO LOOP ]                │
│                (muted · loop · autoplay)                   │
│                                                            │
│        SWELL                                               │  ← big playful display
│        your surf forecast                                  │  ← slogan
│                                                            │
│   (no eyebrow label, no LIVE badge, no condition strip)    │
├──────────────────────────────────────────────────────────┤
│  [ interesting ground — bg.svg wave motif ]                │
│                                                            │
│   TODAY'S BOARD                          RANKED BY SWELL ↓ │
│   ┌────────────────────────────────────────────────────┐  │
│   │ #1  PIPELINE      ● EPIC   3.6m   13s NW   ▓▓▓▓▓▓▓  │  │  ← world-famous spots
│   │ #2  TEAHUPO'O     ● GOOD   2.4m   11s SW   ▓▓▓▓▓░░  │  │    row = Archivo + Mono
│   │ #3  NAZARÉ        ● GOOD   2.1m    9s NW   ▓▓▓▓░░░  │  │    + 7-day heat strip
│   │ #4  JEFFREYS BAY  ● FAIR   1.4m    8s SW   ▓▓▓░░░░  │  │
│   │ ...                                                │  │
│   └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│   RECOMMENDED                                              │
│   → logged in:  your liked spots                           │
│   → logged out: a curated pick of famous spots            │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│   │ card   │ │ card   │ │ card   │ │ card   │              │  ← reuse SurfSpot card
│   └────────┘ └────────┘ └────────┘ └────────┘              │
├──────────────────────────────────────────────────────────┤
│  [ DARK FOOTER — already built ]                           │
│  SWELL · links · contact · Open-Meteo credit               │
└──────────────────────────────────────────────────────────┘
```

### Section notes

1. **Navbar** — keep current white nav. Sign In / Log out already wired.
2. **Hero** — full-bleed `<video>` (muted/loop/autoplay/playsInline) with a
   dark overlay for text contrast. Big display headline "SWELL" + slogan.
   Placeholder gradient until a real royalty-free surf clip is dropped in
   `public/`. Nothing else on the hero.
3. **Today's Board** — ranked table of **world-famous spots** (not just
   Portugal). Each row: rank, name, rating dot, swell, period·dir, 7-day
   heat strip. This is the hero data module.
4. **Recommended** — logged in → the user's liked spots; logged out → a
   curated set of famous spots. Reuses the existing `SurfSpot` card.
5. **Footer** — already built; may restyle to match.

## Future pages (not now)

- **Spot detail** — big rating, 7-day rail, switchable hourly chart
  (bars / area / dots), best windows, wind / tide / water. Needs routing.
- **Profile** — the user's liked spots, account.

## Open items / data the design wants

- **World-famous spots in the DB** — extend `spots` beyond the 12 Portugal
  entries (Pipeline, Teahupo'o, Jeffreys Bay, Uluwatu, Nazaré, …).
- **Real rating inputs** — today the rating is wave-height only. A real one
  needs swell **period + direction + wind (offshore good) + tide + spot
  orientation**. New data sources + per-spot metadata. (Roadmap.)
- **Hero video asset** — royalty-free surf loop (Pexels / Coverr) in `public/`.
- **7-day heat strip** — needs the daily forecast already returned by
  `/api/forecast` (hourly → daily max), coloured by rating.
