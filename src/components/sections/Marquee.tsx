const ITEMS = [
  "tap to connect",
  "no app needed",
  "works on any phone",
  "built in 2 minutes",
  "share your whole vibe",
  "one card, endless links",
];

/**
 * How many times the list is repeated to build one half of the track.
 *
 * The loop works by rendering the content twice and translating exactly -50%,
 * so each half has to be at least as wide as the screen. One pass of the list
 * measures ~2060px, which is fine on a laptop but leaves a ~500px empty stretch
 * on a 2560px monitor for part of every cycle — the ribbon looks like it
 * stopped. Three passes covers displays up to ~6100px.
 */
const REPEATS = 3;

export function Marquee({
  reverse = false,
  className = "bg-acid text-ink",
}: {
  reverse?: boolean;
  className?: string;
}) {
  const half = Array.from({ length: REPEATS }, () => ITEMS).flat();
  const strip = [...half, ...half];

  return (
    <div
      className={`relative overflow-hidden border-y-2 border-ink py-4 ${className}`}
      aria-hidden="true"
    >
      <div
        className={`flex w-max ${reverse ? "marquee-track-reverse" : "marquee-track"}`}
        style={{ ["--speed" as string]: "34s" }}
      >
        {strip.map((item, index) => (
          <span
            key={index}
            className="flex shrink-0 items-center gap-6 px-6 text-xl font-black uppercase tracking-tight sm:text-2xl"
          >
            {item}
            <span className="text-2xl leading-none opacity-60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
