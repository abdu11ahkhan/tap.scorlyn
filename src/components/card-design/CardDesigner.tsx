"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCw } from "lucide-react";
import type { CardProfile } from "@/lib/card";
import NfcCardArt, {
  CARD_FIELD_OPTIONS,
  CARD_FINISHES,
  DEFAULT_CARD_FIELDS,
  type CardFields,
  type CardFinish,
} from "./NfcCardArt";

/**
 * The physical card, designed from the digital one.
 *
 * Deliberately derives everything from the same CardProfile the templates use —
 * name, headline, accent, avatar. Nothing to fill in twice, and the card can
 * never drift from the profile it points at. What gets *printed* is a separate
 * choice: a card has far less room than a profile page.
 */
export default function CardDesigner({
  card,
  profileUrl,
  width = 380,
  compact = false,
  onChange,
}: {
  card: CardProfile;
  profileUrl: string;
  /** Upper bound. The card shrinks below this to fit narrow screens. */
  width?: number;
  compact?: boolean;
  /** Reports the current artwork, so an order can record what was approved. */
  onChange?: (design: { finish: CardFinish; fields: CardFields }) => void;
}) {
  const [finish, setFinish] = useState<CardFinish>("minimal");
  const [face, setFace] = useState<"front" | "back">("front");
  const [fields, setFields] = useState<CardFields>(DEFAULT_CARD_FIELDS);

  // Reported on every change rather than only on submit, so the order form
  // always holds the artwork currently on screen.
  useEffect(() => {
    onChange?.({ finish, fields });
    // onChange is typically an inline arrow; depending on it would re-run this
    // on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish, fields]);

  // The card is drawn at a pixel width (every dimension is a fraction of it),
  // so it can't be sized in CSS — it has to be measured.
  const stage = useRef<HTMLDivElement>(null);
  const [drawWidth, setDrawWidth] = useState(width);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      // Ignore zero: a hidden or detached node reports it, and acting on it
      // would collapse the card to nothing.
      const available = Math.floor(el.clientWidth);
      if (available > 0) setDrawWidth(Math.min(width, available));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const toggle = (id: keyof CardFields) =>
    setFields((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div ref={stage} className="flex justify-center">
        <NfcCardArt
          card={card}
          finish={finish}
          face={face}
          profileUrl={profileUrl}
          fields={fields}
          width={drawWidth}
        />
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setFace((f) => (f === "front" ? "back" : "front"))}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/20 px-5 text-xs font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {face === "front" ? "see back" : "see front"}
        </button>
      </div>

      {/* Finishes */}
      <div className="mt-6">
        <p className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
          card finish
        </p>
        <div className={`flex flex-wrap justify-center gap-2 ${compact ? "" : "px-2"}`}>
          {CARD_FINISHES.map((option) => {
            const isActive = option.id === finish;
            return (
              <button
                key={option.id}
                type="button"
                title={option.blurb}
                onClick={() => setFinish(option.id)}
                className={`min-h-11 rounded-full border-2 px-4 text-xs font-black lowercase transition-colors ${
                  isActive
                    ? "border-ink bg-acid text-ink"
                    : "border-white/20 text-white/60 hover:border-white/45 hover:text-white"
                }`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs font-medium text-white/40">
          {CARD_FINISHES.find((f) => f.id === finish)?.blurb}
        </p>
      </div>

      {/* What's printed */}
      <div className="mt-7 border-t-2 border-white/10 pt-6">
        <p className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
          show on card
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CARD_FIELD_OPTIONS.map(({ id, label }) => {
            const on = fields[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={on}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-xs font-black lowercase transition-colors ${
                  on
                    ? "border-acid/70 bg-acid/15 text-acid"
                    : "border-white/15 text-white/40 hover:border-white/35 hover:text-white/70"
                }`}
              >
                <Check
                  className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                    on ? "opacity-100" : "opacity-25"
                  }`}
                />
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs font-medium text-white/35">
          Everything stays on your profile — this only changes what gets printed.
        </p>
      </div>

      {!compact && (
        <p className="mt-6 text-center text-[11px] font-semibold leading-relaxed text-white/30">
          Printed at 85.6 × 54 mm — standard card size. The QR is a fallback for
          phones that can&apos;t tap; both point at the same profile.
        </p>
      )}
    </div>
  );
}
