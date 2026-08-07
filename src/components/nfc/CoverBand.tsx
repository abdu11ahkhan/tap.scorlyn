/**
 * The cover photo, for templates that have nowhere of their own to put one.
 *
 * Six of the twenty-four templates build a cover into their layout. The other
 * eighteen — including the two people are actually using — ignored the field
 * entirely, so uploading a background did nothing at all and there was no way
 * to tell why.
 *
 * A band at the top rather than a full-page backdrop: every template paints a
 * solid background, so anything behind them is simply not visible, and making
 * those backgrounds translucent would put body text over a photograph in
 * eighteen designs at once.
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
    <div className="relative h-40 w-full overflow-hidden sm:h-52">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />

      {/* Fades into whatever the template starts with, so the seam disappears
          instead of reading as a pasted-on header. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: `linear-gradient(to top, ${tone}, transparent)` }}
      />
    </div>
  );
}
