const ITEMS = [
  "tap to connect",
  "no app needed",
  "works on any phone",
  "built in 2 minutes",
  "share your whole vibe",
  "one card, endless links",
];

/**
 * Scrolling ticker. The content is rendered twice and the track translates
 * exactly -50%, so the loop is seamless with no JS measuring widths.
 */
export function Marquee({
  reverse = false,
  className = "bg-acid text-ink",
}: {
  reverse?: boolean;
  className?: string;
}) {
  const strip = [...ITEMS, ...ITEMS];

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
