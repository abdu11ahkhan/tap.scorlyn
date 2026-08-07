"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import BlankCardArt from "@/components/card-design/BlankCardArt";
import NfcCardArt, {
  CARD_FINISHES,
  DEFAULT_CARD_FIELDS,
  type CardFinish,
} from "@/components/card-design/NfcCardArt";
import type { CardProfile } from "@/lib/card";

type Plan = { id: string; name: string; price_pkr: number; blurb: string | null };

/**
 * Blank card or your own design, side by side.
 *
 * The free page is the thing people arrive for, and nothing on it ever showed
 * what the physical card looks like — so the paid product was an abstract line
 * of text next to something they already had. Both options are drawn here with
 * the visitor's real card and their real link, because a picture of the actual
 * object is the argument.
 */
export default function NfcChooser({
  card,
  profileUrl,
  blank,
  custom,
}: {
  card: CardProfile;
  profileUrl: string;
  blank: Plan | null;
  custom: Plan | null;
}) {
  const [finish, setFinish] = useState<CardFinish>("minimal");

  const money = (n: number) => `Rs.${n.toLocaleString()}`;

  const panel =
    "flex flex-col rounded-2xl border-2 border-white/12 bg-white/[0.03] p-5 sm:p-6";
  const cta =
    "sticker sticker-press mt-5 flex h-13 items-center justify-center gap-2 rounded-full border-2 border-ink text-sm font-black uppercase tracking-tight";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---- blank ---- */}
        {blank && (
          <section className={panel}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-black text-white">Blank card</h2>
              <p className="shrink-0 text-xl font-black text-acid">{money(blank.price_pkr)}</p>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-white/50">
              A plain card carrying your link. Nothing printed on it but our
              mark and your QR.
            </p>

            <div className="mt-5 flex justify-center rounded-xl bg-black/30 p-5">
              <BlankCardArt profileUrl={profileUrl} width={300} />
            </div>

            <ul className="mt-5 space-y-2 text-sm font-semibold text-white/60">
              {["Tap opens your page", "QR on the back for phones that won't tap", "Posted anywhere in Pakistan"].map(
                (line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                    {line}
                  </li>
                )
              )}
            </ul>

            <Link
              href={`/dashboard/orders?plan=${blank.id}`}
              className={`${cta} bg-white text-ink`}
            >
              order blank
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {/* ---- custom ---- */}
        {custom && (
          <section className={`${panel} border-acid/40`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-black text-white">Your design</h2>
              <p className="shrink-0 text-xl font-black text-acid">{money(custom.price_pkr)}</p>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-white/50">
              Your name, your details and your colour printed on the card
              itself. Pick a finish and it goes to print exactly like this.
            </p>

            <div className="mt-5 flex justify-center rounded-xl bg-black/30 p-5">
              <NfcCardArt
                card={card}
                finish={finish}
                face="front"
                profileUrl={profileUrl}
                fields={DEFAULT_CARD_FIELDS}
                width={300}
              />
            </div>

            {/* The finish is the whole reason to pay the difference, so it is
                chosen here rather than hidden behind the order form. */}
            <div className="mt-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/40">
                finish
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CARD_FINISHES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFinish(option.id)}
                    className={`rounded-full border-2 px-3 py-1.5 text-xs font-black lowercase transition-colors ${
                      option.id === finish
                        ? "border-acid bg-acid text-ink"
                        : "border-white/15 text-white/60 hover:text-white"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href={`/dashboard/orders?plan=${custom.id}&finish=${finish}`}
              className={`${cta} bg-acid text-ink`}
            >
              order this design
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </div>

      <p className="text-center text-sm font-semibold text-white/40">
        Both open the same page you already made. The card is how you hand it
        over without spelling out a link.
      </p>
    </div>
  );
}
