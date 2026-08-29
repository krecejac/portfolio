import { Waves, Clock, Wind, Compass } from "lucide-react";
import { RATING, type RatingKey } from "../rating";

// About page: what Swell is and, in plain terms, how the surf score works.
// Copy is deliberately casual — this is a portfolio project, not a whitepaper.
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
        About
      </p>
      <h1 className="mt-2 font-display text-5xl uppercase tracking-tight text-ink sm:text-6xl">
        About Swell
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-slate-600">
        Swell ranks surf spots around the world by how good the waves actually
        are <em>right now</em> — not just how big they are. I built it as a
        portfolio project, mostly to learn full-stack properly, but I got a
        little carried away and ended up wanting it to feel like something you'd
        genuinely open before a session.
      </p>

      <Section title="What it does">
        It pulls live marine and weather data for a few thousand real breaks,
        gives each one a score out of 100, and sorts the list so the spots that
        are firing float to the top. Tap any spot and you get the full picture —
        swell, wind, tide, water temp, what wetsuit to bring, the lot.
      </Section>

      <Section title="How the score works">
        Here's the thing: a big wave isn't automatically a good wave. Anyone
        who's paddled out into a windblown mess knows that. So instead of just
        ranking by size, the model looks at four things and weighs them together.
      </Section>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Factor icon={<Waves size={20} />} title="Size" text="Enough to ride, not so much it closes out." />
        <Factor icon={<Clock size={20} />} title="Period" text="Long-period swell has real power; short chop doesn't." />
        <Factor icon={<Wind size={20} />} title="Wind" text="Light and offshore is the dream. Strong onshore ruins it." />
        <Factor icon={<Compass size={20} />} title="Swell angle" text="Is the swell even pointed at the beach?" />
      </div>

      <p className="mt-6 leading-relaxed text-slate-600">
        Those four get mashed into a single 0–100 number, which then drops into a
        band. Clean long-period swell in a light offshore breeze scores high;
        weak, gutless wind-chop scores low. That's really the whole trick — no AI,
        no neural nets, just a formula that mostly agrees with what you'd see if
        you drove down and looked at the water yourself.
      </p>

      {/* rating scale */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["flat", "poor", "fair", "good", "epic"] as RatingKey[]).map((k) => (
          <span
            key={k}
            className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white ${RATING[k].dot}`}
          >
            {RATING[k].label}
          </span>
        ))}
      </div>

      <Section title="Why wind is the big one">
        Wind is the factor that makes or breaks a session, so it's worth a
        picture. Blowing off the land it holds the wave face up and grooms it
        clean. Blowing off the sea it crumbles everything into slop. Every spot in
        the app knows which way it faces the ocean, so it can actually tell those
        two apart instead of just looking at wind speed.
      </Section>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <WindPanel kind="offshore" />
        <WindPanel kind="onshore" />
      </div>

      <Section title="Where the numbers come from">
        All the marine and weather data is from Open-Meteo, a free and open
        forecast API. I'm not running my own wave model like the big forecasters
        do — this is a scoring layer sitting on top of solid public data. It won't
        out-predict Surfline at their local break, but it covers a whole lot more
        of the planet, for free, and the logic is all mine.
      </Section>

      <Section title="Built with">
        React and TypeScript on the front, Node/Express and PostgreSQL on the
        back, Docker holding it together. Maps by OpenStreetMap. The scoring all
        happens on the server and gets cached, so the app stays quick even with
        thousands of spots.
      </Section>

      <Section title="Fair warning">
        It's a heuristic, not gospel. Cam coverage is patchy, remote spots lean on
        coarser data, and the tide is modelled rather than measured at a station.
        Treat it as a strong hint — then check the real window before you wax up.
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl uppercase tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-slate-600">{children}</p>
    </section>
  );
}

function Factor({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
        {icon}
      </span>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-ink">
        {title}
      </p>
      <p className="mt-1 text-sm leading-snug text-slate-500">{text}</p>
    </div>
  );
}

// A tiny schematic: a wave hump with a wind arrow over it. Offshore blows toward
// the sea (holds it up, green); onshore blows toward the land (messy, red).
function WindPanel({ kind }: { kind: "offshore" | "onshore" }) {
  const offshore = kind === "offshore";
  const color = offshore ? "#34d399" : "#f43f5e";
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <svg viewBox="0 0 120 60" className="h-24 w-full">
        {/* sea baseline */}
        <line x1="0" y1="50" x2="120" y2="50" stroke="#cbd5e1" strokeWidth="1" />
        {/* wave hump */}
        <path
          d="M0,50 C24,50 34,22 60,22 C86,22 96,50 120,50 Z"
          fill="#007fff"
          fillOpacity="0.12"
        />
        <path
          d="M0,50 C24,50 34,22 60,22 C86,22 96,50 120,50"
          fill="none"
          stroke="#007fff"
          strokeWidth="2"
        />
        {/* wind arrow above the crest */}
        {offshore ? (
          <>
            <line x1="86" y1="12" x2="42" y2="12" stroke={color} strokeWidth="2.5" />
            <polygon points="42,12 50,7 50,17" fill={color} />
          </>
        ) : (
          <>
            <line x1="34" y1="12" x2="78" y2="12" stroke={color} strokeWidth="2.5" />
            <polygon points="78,12 70,7 70,17" fill={color} />
          </>
        )}
      </svg>
      <p className="mt-2 text-center font-mono text-xs uppercase tracking-[0.14em]" style={{ color }}>
        {offshore ? "Offshore · clean" : "Onshore · messy"}
      </p>
    </div>
  );
}
