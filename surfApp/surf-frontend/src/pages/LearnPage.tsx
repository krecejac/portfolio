// Learn page: surf etiquette — the unwritten rules of the lineup — plus a short
// "reading the forecast" primer at the end.

const RULES: { title: string; body: string }[] = [
  {
    title: "Right of way",
    body: "The surfer closest to the peak — the breaking part of the wave — has priority. If you're further down the line, it's not your wave. Learn to read who's up and where the wave is breaking before you paddle.",
  },
  {
    title: "Don't drop in",
    body: "Never take off on a wave that someone with priority is already riding. Dropping in front of them ruins their wave and risks a collision. When in doubt, pull back.",
  },
  {
    title: "Don't snake",
    body: "Snaking is repeatedly paddling around someone to put yourself closest to the peak and steal priority. Wait your turn — the lineup notices, and so do you when it's done to you.",
  },
  {
    title: "Paddle out smart",
    body: "Paddle out around the lineup through the channel, never straight through the peak where people are riding. If a wave's coming and someone's on it, paddle behind them, into the whitewater — never in front.",
  },
  {
    title: "Hold onto your board",
    body: "Don't ditch your board and dive under when a wave comes if there's anyone behind you. A loose board on a leash is a wrecking ball. Learn to duck-dive or turtle-roll instead.",
  },
  {
    title: "Communicate",
    body: "On a peak that breaks both ways, call your direction — 'left!' or 'right!' — so another surfer can take the other shoulder. Clear intent prevents two people going for the same wave.",
  },
  {
    title: "Respect the locals",
    body: "Every lineup has a pecking order, and locals surf it every day. Show up humble, watch how it works, don't paddle straight to the peak, and don't be greedy. Respect earns waves.",
  },
  {
    title: "Apologize",
    body: "Everyone messes up sometimes — a blown call, an accidental drop-in. A quick, genuine 'sorry, my bad' defuses almost anything. Owning a mistake keeps the vibe in the water friendly.",
  },
  {
    title: "Know your limits",
    body: "Don't paddle out into waves or crowds beyond your ability. You endanger yourself and everyone around you. Pick a spot and a size that match your level, and build up from there.",
  },
  {
    title: "Give respect to get respect",
    body: "Share waves, cheer others into good ones, and look out for anyone in trouble. The best surfers in the lineup are usually the most generous. Good energy comes back around.",
  },
];

const FORECAST: { term: string; body: string }[] = [
  {
    term: "Swell height",
    body: "How big the waves are (significant wave height). Bigger isn't always better — it has to be organised.",
  },
  {
    term: "Period",
    body: "Seconds between waves. Longer period (12s+) means more powerful, cleaner swell that's travelled far. Short period is wind chop.",
  },
  {
    term: "Direction",
    body: "Where the swell comes from. A spot only works for swell directions that line up with how the reef or beach faces.",
  },
  {
    term: "Wind",
    body: "Offshore wind (land to sea) grooms waves clean; onshore wind messes them up. Our surf score factors this in.",
  },
];

export default function LearnPage() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
        Learn
      </p>
      <h1 className="mt-2 font-display text-5xl uppercase tracking-tight text-ink sm:text-6xl">
        Surf etiquette
      </h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        Surfing has no referee — just a set of unwritten rules that keep the
        lineup safe and fair. Learn these before you paddle out at a new spot,
        and you'll be welcome anywhere.
      </p>

      <ol className="mt-10 space-y-4">
        {RULES.map((rule, i) => (
          <li
            key={rule.title}
            className="flex gap-5 rounded-2xl border border-ink/10 bg-white p-6"
          >
            <span className="font-display text-4xl leading-none text-brand">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="font-display text-xl uppercase tracking-tight text-ink">
                {rule.title}
              </h2>
              <p className="mt-2 leading-relaxed text-slate-600">{rule.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* forecast primer */}
      <h2 className="mt-16 font-display text-4xl uppercase tracking-tight text-ink">
        Reading the forecast
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">
        A few basics to make sense of the numbers on the board.
      </p>
      <div className="mt-6 space-y-4">
        {FORECAST.map((tip) => (
          <div
            key={tip.term}
            className="rounded-2xl border border-ink/10 bg-white p-6"
          >
            <h3 className="font-display text-lg uppercase tracking-tight text-ink">
              {tip.term}
            </h3>
            <p className="mt-2 leading-relaxed text-slate-600">{tip.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
