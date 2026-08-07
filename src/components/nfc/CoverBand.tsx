/**
 * The cover photo, for templates that have nowhere of their own to put one.
 *
 * Six of the templates build a cover into their layout. The rest ignored the
 * field entirely, so uploading a background did nothing at all and there was
 * no way to tell why.
 *
 * A band at the top rather than a full-page backdrop: every template paints a
 * solid background, so anything behind them is simply not visible, and making
 * those backgrounds translucent would put body text over a photograph in
 * dozens of designs at once.
 */
export default function CoverBand({
  src,
  tone,
  width = "max-w-md",
}: {
  src: string;
  /** The template's own background, so the fade lands on it invisibly. */
  tone: string;
  /** The content column this template uses. The band is pinned to the same
   *  width — stretched across a desktop viewport it stopped reading as part
   *  of the card and became a random strip of photo above it. */
  width?: string;
}) {
  return (
    /* Full-width backing in the template's own colour. The band is pinned to
       the content column; without this the page background shows through on
       either side of it and the seam reappears. */
    <div className="w-full" style={{ background: tone }}>
      <div className={`relative mx-auto w-full ${width}`}>
      {/* Aspect ratio rather than a fixed height: a fixed strip crops a tall
          photo to a sliver on desktop while leaving a mobile one letterboxed. */}
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[2/1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" />

          {/* Fades into whatever the template starts with, so the seam disappears
              instead of reading as a pasted-on header. Covers most of the band —
              a short fade leaves a visible hard edge where the photo stops. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
            style={{
              background: `linear-gradient(to top, ${tone} 12%, ${tone}00 100%)`,
            }}
          />
          {/* The sides too, so the photo doesn't end in two hard vertical edges
              against the page on wide screens. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-10"
            style={{ background: `linear-gradient(to right, ${tone}, ${tone}00)` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10"
            style={{ background: `linear-gradient(to left, ${tone}, ${tone}00)` }}
          />
        </div>
      </div>
    </div>
  );
}
