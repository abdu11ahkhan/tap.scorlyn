/**
 * The cover photo, for templates that have nowhere of their own to put one.
 *
 * Six of the templates build a cover into their layout. The rest ignored the
 * field entirely, so uploading a background did nothing at all and there was
 * no way to tell why.
 *
 * A hero at the top rather than a full-page backdrop: every template paints a
 * solid background, so anything behind them is simply not visible, and making
 * those backgrounds translucent would put body text over a photograph in
 * dozens of designs at once.
 */
export default function CoverBand({
  src,
  tone,
}: {
  src: string;
  /** The template's own background, so the fade lands on it invisibly. */
  tone: string;
}) {
  return (
    // Full-bleed. Pinning it to the content column left it reading as a strip
    // pasted above the card rather than the top of the card itself.
    <div className="relative w-full" style={{ background: tone }}>
      {/* Viewport-relative so it stays a hero on a phone instead of a letterbox,
          with a floor and a ceiling so it can't swallow a short screen or turn
          into a banner on a desktop one.

          Smaller by default: at the old 38vh/420px, the name and the save
          button both landed 400-650px down a 390x800 phone — a visitor saw a
          photo and nothing else for most of the first screen. Shrinks
          further on phones, eases back up from sm: (tablet) and is back to
          the original figures from lg: (desktop), where there's room for a
          hero without pushing identity off-screen. */}
      <div className="relative h-[20vh] max-h-[190px] min-h-[140px] w-full overflow-hidden sm:h-[28vh] sm:max-h-[300px] sm:min-h-[200px] lg:h-[38vh] lg:max-h-[420px] lg:min-h-[240px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />

        {/* Long fade into the template's own colour. A short one leaves the
            visible hard edge where the photo simply stops. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
          style={{
            background: `linear-gradient(to top, ${tone} 8%, ${tone}00 100%)`,
          }}
        />
      </div>
    </div>
  );
}
