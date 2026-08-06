"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { readStorage, writeStorage } from "@/lib/safe-storage";
import { ArrowRight, SmartphoneNfc, X } from "lucide-react";
import { referralOrderUrl, referralSignupUrl } from "@/lib/referral";

/**
 * The viral loop: everyone who opens someone else's card is a prospect.
 *
 * No push permission involved — a sticky in-page CTA is the only thing that
 * works on every phone, and it costs the visitor nothing.
 *
 * Dismissal used to write a permanent, card-agnostic flag, so one tap on the
 * X switched the loop off for that browser on every card, forever. It expires
 * now, and dismissing collapses the CTA to a small pill rather than removing
 * it — the visitor stops being nagged, but the way in is still there.
 *
 * Shown to the owner too. Hiding it from them was tidier in theory and worse
 * in practice: the owner is the one person who checks their own card, so they
 * were the only person who could never confirm the loop was working.
 */
const DISMISS_KEY = "ScorlynTap_banner_dismissed_at";
const DISMISS_DAYS = 7;
const SPRING: Transition = { type: "spring", stiffness: 260, damping: 26 };

type Stage = "hidden" | "full" | "pill";

export default function ReferralBanner({
  refCode,
  cardProfileId,
  ownerName,
  cardPrice = null,
}: {
  refCode: string | null;
  cardProfileId: string;
  ownerName: string;
  /** Cheapest physical plan, so the CTA can quote a real number. */
  cardPrice?: number | null;
}) {
  const [stage, setStage] = useState<Stage>("hidden");

  useEffect(() => {
    const dismissedAt = Number(readStorage("local", DISMISS_KEY) ?? 0);
    const stillQuiet =
      dismissedAt > 0 &&
      Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;

    if (stillQuiet) {
      setStage("pill");
      return;
    }

    // Let the card land first — an instant banner reads as a popup ad.
    const timer = setTimeout(() => setStage("full"), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (stage !== "full" || !refCode) return;
    track("banner_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, refCode]);

  const track = (eventType: "banner_view" | "banner_click" | "order") => {
    if (!refCode) return;
    fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refCode, cardProfileId, eventType }),
      keepalive: true,
    }).catch(() => {});
  };

  const dismiss = () => {
    writeStorage("local", DISMISS_KEY, String(Date.now()));
    setStage("pill");
  };

  const firstName = ownerName.trim().split(" ")[0] || "theirs";

  return (
    <AnimatePresence mode="wait">
      {stage === "full" && (
        <motion.div
          key="full"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={SPRING}
          className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto max-w-md rounded-2xl border-2 border-ink bg-ink p-3 shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-acid">
                <SmartphoneNfc className="h-[18px] w-[18px] text-ink" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black leading-tight text-white">
                  Want a card like {firstName}&apos;s?
                </p>
                <p className="truncate text-[11px] font-semibold leading-tight text-white/45">
                  One tap shares everything you do.
                </p>
              </div>

              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="shrink-0 p-1 text-white/35 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Two intents, because they're genuinely different people: some
                want the free page, some want the physical card in their hand. */}
            <div className="mt-2.5 flex gap-2">
              <Link
                href={referralSignupUrl(refCode)}
                onClick={() => track("banner_click")}
                className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-white/15 px-3 py-2 text-center transition-colors hover:border-white/35"
              >
                <span className="text-[12px] font-black uppercase tracking-tight text-white">
                  make mine
                </span>
                <span className="text-[10px] font-bold text-white/40">free</span>
              </Link>

              <Link
                href={referralOrderUrl(refCode)}
                onClick={() => track("order")}
                className="flex flex-1 flex-col items-center justify-center rounded-xl bg-acid px-3 py-2 text-center"
              >
                <span className="flex items-center gap-1 text-[12px] font-black uppercase tracking-tight text-ink">
                  order a card
                  <ArrowRight className="h-3 w-3" />
                </span>
                {cardPrice ? (
                  <span className="text-[10px] font-bold text-ink/55">
                    from Rs.{cardPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-ink/55">
                    posted to you
                  </span>
                )}
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {stage === "pill" && (
        <motion.button
          key="pill"
          type="button"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={SPRING}
          onClick={() => setStage("full")}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-4 py-2.5 text-[12px] font-black uppercase tracking-tight text-ink shadow-[0_6px_20px_rgba(0,0,0,0.45)] mb-[env(safe-area-inset-bottom)]"
        >
          <SmartphoneNfc className="h-4 w-4" />
          get a card
        </motion.button>
      )}
    </AnimatePresence>
  );
}
