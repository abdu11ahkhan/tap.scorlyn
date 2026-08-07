"use client";

import NfcCardArt, {
  DEFAULT_CARD_FIELDS,
  type CardFields,
  type CardFinish,
} from "@/components/card-design/NfcCardArt";
import type { CardProfile } from "@/lib/card";

/**
 * Both faces of the ordered card, at a size you can actually check.
 *
 * A client boundary because the art draws its QR with qrcode.react. Kept
 * separate from the print sheet: this one is for glancing at while handling
 * the order, that one is for sending to a printer.
 */
export default function OrderCardArt({
  card,
  finish,
  fields,
}: {
  card: CardProfile;
  finish: string;
  fields: CardFields | null;
}) {
  const profileUrl = `https://tap.scorlyn.com/u/${card.username}`;

  return (
    <div className="flex flex-wrap gap-5">
      {(["front", "back"] as const).map((face) => (
        <figure key={face} className="min-w-0">
          <figcaption className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            {face}
          </figcaption>
          <NfcCardArt
            card={card}
            finish={finish as CardFinish}
            face={face}
            profileUrl={profileUrl}
            fields={fields ?? DEFAULT_CARD_FIELDS}
            width={320}
          />
        </figure>
      ))}
    </div>
  );
}
