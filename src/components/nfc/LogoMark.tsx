/**
 * The company logo, drawn small over the card.
 *
 * Rendered once around every template rather than inside each of them: there
 * are three dozen layouts and a logo is the same gesture in all of them, so
 * threading it through each one would mean thirty-six chances to forget.
 *
 * Bottom-left is the only corner that is reliably free — the share button sits
 * top-right and the "get a card" pill bottom-right.
 */
export default function LogoMark({
  src,
  tone,
}: {
  src: string;
  /** The template's own background, so the plate behind the logo blends in. */
  tone: string;
}) {
  return (
    <div
      className="pointer-events-none fixed left-4 z-30 flex h-12 items-center rounded-xl px-2.5 backdrop-blur-sm"
      // A faint plate, because a logo dropped straight onto a photograph or a
      // busy gallery is unreadable. Alpha keeps it from reading as a button.
      // The bottom offset reads the same referral-banner-height CSS var as
      // CardQr, so this also lifts clear when the full banner is showing.
      style={{ bottom: "calc(1rem + var(--sc-referral-offset, 0px))", background: `${tone}D9` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-h-8 w-auto max-w-28 object-contain opacity-90"
      />
    </div>
  );
}
