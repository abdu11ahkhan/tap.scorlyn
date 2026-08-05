"use client";

import { useState } from "react";
import { QrCode, RotateCw } from "lucide-react";
import type { CardProfile } from "@/lib/card";
import NfcCardArt, { CARD_FINISHES, type CardFinish } from "./NfcCardArt";

/**
 * The physical card, designed from the digital one.
 *
 * Deliberately derives everything from the same CardProfile the templates use —
 * name, headline, accent, avatar. Nothing to fill in twice, and the card can
 * never drift from the profile it points at.
 */
export default function CardDesigner({
  card,
  profileUrl,
  width = 380,
  compact = false,
}: {
  card: CardProfile;
  profileUrl: string;
  width?: number;
  compact?: boolean;
}) {
  const [finish, setFinish] = useState<CardFinish>("minimal");
  const [face, setFace] = useState<"front" | "back">("front");
  const [showQr, setShowQr] = useState(true);

  return (
    <div>
      <div className="flex justify-center">
        <NfcCardArt
          card={card}
          finish={finish}
          face={face}
          profileUrl={profileUrl}
          showQr={showQr}
          width={width}
        />
      </div>

      {/* Flip + QR */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setFace((f) => (f === "front" ? "back" : "front"))}
          className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2.5 text-xs font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {face === "front" ? "see back" : "see front"}
        </button>

        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          aria-pressed={showQr}
          className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-xs font-black lowercase transition-colors ${
            showQr
              ? "border-ink bg-acid text-ink"
              : "border-white/20 text-white/70 hover:border-acid hover:text-acid"
          }`}
        >
          <QrCode className="h-3.5 w-3.5" />
          qr {showQr ? "on" : "off"}
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
                className={`rounded-full border-2 px-4 py-2 text-xs font-black lowercase transition-colors ${
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

      {!compact && (
        <p className="mt-6 text-center text-[11px] font-semibold leading-relaxed text-white/30">
          Printed at 85.6 × 54 mm — standard card size. The QR is a fallback for
          phones that can&apos;t tap; both point at the same profile.
        </p>
      )}
    </div>
  );
}
