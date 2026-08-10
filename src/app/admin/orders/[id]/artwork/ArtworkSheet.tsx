"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import NfcCardArt, {
  DEFAULT_CARD_FIELDS,
  type CardFields,
  type CardFinish,
} from "@/components/card-design/NfcCardArt";
import type { CardProfile } from "@/lib/card";

/**
 * Both faces of the card at print size, plus what the printer needs to know.
 *
 * 1011x638px is 85.6x54mm — ID-1, the bank card size — at 300dpi. Drawing at
 * that size rather than scaling a screen-sized card up means the type is laid
 * out at print dimensions instead of being enlarged after the fact.
 */
const PRINT_WIDTH = 1011;
/** ID-1 is 1.586 wide to tall. */
const PRINT_HEIGHT = Math.round(1011 / 1.586);

export default function ArtworkSheet({
  order,
  card,
  finish,
  fields,
}: {
  /**
   * The order this artwork is for, when there is one. A customer who has
   * published a card and chosen a finish is printable before they have
   * ordered anything, so admin can prepare — and check — the artwork without
   * an order to hang it on.
   */
  order?: {
    reference: string;
    quantity: number;
    branding: string | null;
    fullName: string;
  } | null;
  card: CardProfile;
  finish: string;
  fields: CardFields | null;
}) {
  const profileUrl = `https://tap.scorlyn.com/u/${card.username}`;

  /**
   * "Save as PDF" names the file after the document title, so every sheet
   * came out as the same page name and a folder of them was unidentifiable.
   * Set around the print itself rather than permanently, so the browser tab
   * still reads normally while someone is working.
   */
  const printName = [
    (card.full_name || card.username).replace(/[^a-zA-Z0-9 _-]/g, "").trim(),
    order ? order.reference : `@${card.username}`,
    finish,
  ]
    .filter(Boolean)
    .join(" - ");

  useEffect(() => {
    const original = document.title;
    const before = () => {
      document.title = printName;
    };
    const after = () => {
      document.title = original;
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      document.title = original;
    };
  }, [printName]);

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <h1 className="app-h1">
          Artwork — {order ? order.reference : `@${card.username}`}
        </h1>
        <p className="app-sub mt-1">
          Both faces at 300dpi on an 85.6 × 54 mm card. Print this page to PDF
          and send that to the printer — the type stays vector.
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {order && <span className="app-pill">Quantity: {order.quantity}</span>}
          <span className="app-pill">Finish: {finish}</span>
          {order && (
            <span className="app-pill">
              Branding:{" "}
              {order.branding === "unbranded"
                ? "customer artwork only"
                : "ScorlynTap mark"}
            </span>
          )}
          <span className="app-pill">Chip URL: {profileUrl}</span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black"
        >
          <Printer className="h-4 w-4" />
          Print / save as PDF
        </button>
      </div>

      {/* White ground: the console is dark, and a dark page prints as a dark
          page unless the browser is told to drop backgrounds. */}
      <div className="artwork-print space-y-8 rounded-2xl bg-white p-8 print:rounded-none print:p-0">
        {(["front", "back"] as const).map((face) => (
          <figure key={face} className="break-inside-avoid">
            <figcaption className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 print:mb-1">
              {face} — {card.full_name}
            </figcaption>
            {/* A transform does not change the layout box: the card still
                occupied its full 1011px however far it was scaled, so on paper
                it ran off the page and the right edge — the QR and the NFC
                mark — was cut. The wrapper is sized to the *scaled* result, and
                the scale itself drops in print so the card lands at exactly
                85.6mm rather than 1011 CSS pixels. */}
            <div
              className="artwork-stage"
              style={{
                width: `calc(${PRINT_WIDTH}px * var(--card-scale))`,
                height: `calc(${PRINT_HEIGHT}px * var(--card-scale))`,
              }}
            >
              <div
                className="origin-top-left"
                style={{
                  width: PRINT_WIDTH,
                  height: PRINT_HEIGHT,
                  transform: "scale(var(--card-scale))",
                }}
              >
                <NfcCardArt
                  card={card}
                  finish={finish as CardFinish}
                  face={face}
                  profileUrl={profileUrl}
                  fields={fields ?? DEFAULT_CARD_FIELDS}
                  width={PRINT_WIDTH}
                />
              </div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
