// Full-bleed hero: background surf video + big headline.
export default function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[460px] w-full overflow-hidden bg-ink snap-start scroll-mt-16">
      {/* background video — drop /public/hero.mp4 to fill it in */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster="/bg.svg"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* dark overlay so the text stays readable over any footage */}
      <div className="absolute inset-0 bg-ink/40" />

      {/* headline, pinned to the bottom-left */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-8 pb-14">
        <h1 className="font-display text-9xl uppercase leading-none tracking-tight text-white">
          Swell
        </h1>
        <p className="mt-3 font-mono text-sm uppercase tracking-[0.2em] text-white/80 sm:text-base">
          your surf forecast, for free!
        </p>
      </div>
    </section>
  );
}
