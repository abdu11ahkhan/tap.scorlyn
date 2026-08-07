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
          into a banner on a desktop one. */}
      <div className="relative h-[38vh] max-h-[420px] min-h-[240px] w-full overflow-hidden">
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
