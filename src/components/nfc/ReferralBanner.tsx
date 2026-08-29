"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { ArrowRight, SmartphoneNfc, X } from "lucide-react";
import { referralOrderUrl, referralTemplateUrl } from "@/lib/referral";

/**
 * The viral loop: everyone who opens someone else's card is a prospect.
 *
 * No push permission involved — a sticky in-page CTA is the only thing that
 * works on every phone, and it costs the visitor nothing.
 *
 * It opens closed. The full CTA used to raise itself over the card 1.8s after
 * landing, which put an ad over someone else's business card at the moment
 * they were reading it — and over the save-contact dock, which is the one
 * thing they actually came to press. Now only the pill shows, and the full
 * panel is something the visitor asks for by tapping it. Dismissing the panel
 * puts it back to the pill, so the way in is always there and never in front.
 *
 * Shown to the owner too. Hiding it from them was tidier in theory and worse
 * in practice: the owner is the one person who checks their own card, so they
 * were the only person who could never confirm the loop was working.
 */
const SPRING: Transition = { type: "spring", stiffness: 260, damping: 26 };

/**
 * Published on <html> so the QR trigger and logo watermark — both fixed to
 * the bottom of the screen, both mounted by the template renderer with no
 * knowledge of this banner — can lift clear of it instead of being covered.
 * A measured height rather than a guessed one, since the banner's content
 * (and so its height) varies with whether cardPrice is set.
 */
const BANNER_OFFSET_VAR = "--sc-referral-offset";

type Stage = "full" | "pill";

export default function ReferralBanner({
  refCode,
  cardProfileId,
  ownerName,
  template,
  cardPrice = null,
}: {
  refCode: string | null;
  cardProfileId: string;
  ownerName: string;
  /** The design they just tapped — what "a card like theirs" actually means. */
  template: string;
  /** Cheapest physical plan, so the CTA can quote a real number. */
  cardPrice?: number | null;
}) {
  // Starts on the pill directly — nothing opens on its own, ever, so there
  // is no "hidden" state to flip out of after mount.
  const [shown, setShown] = useState<Stage>("pill");

  // One ref for whichever of the two is mounted — AnimatePresence only ever
  // renders one at a time, and both need measuring (see below).
  const bannerRef = useRef<HTMLDivElement>(null);

  // Only the full-width "full" stage collides with anything — the pill sits
  // in the bottom-right corner, clear of the QR trigger and logo watermark.
  useEffect(() => {
    const root = document.documentElement;
    if (shown !== "full") {
      root.style.setProperty(BANNER_OFFSET_VAR, "0px");
      return;
    }
    const el = bannerRef.current;
    if (!el) return;
    const publish = () => root.style.setProperty(BANNER_OFFSET_VAR, `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty(BANNER_OFFSET_VAR, "0px");
    };
  }, [shown]);

  // Declared above the effect that calls it. As a const below, the effect
  // closed over a binding that did not exist yet at the point it was written —
  // it happened to work because effects run after the whole body, but it is
  // exactly the shape that breaks the moment anything calls it during render.
  const track = useCallback(
    (eventType: "banner_view" | "banner_click" | "order") => {
      if (!refCode) return;
      fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refCode, cardProfileId, eventType }),
        keepalive: true,
      }).catch(() => {});
    },
    [refCode, cardProfileId]
  );

  useEffect(() => {
    if (shown !== "full" || !refCode) return;
    track("banner_view");
  }, [shown, refCode, track]);

  const dismiss = () => setShown("pill");

  const firstName = ownerName.trim().split(" ")[0] || "theirs";

  return (
    <AnimatePresence mode="wait">
      {shown === "full" && (
        <motion.div
          key="full"
          ref={bannerRef}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={SPRING}
          className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto max-w-md rounded-2xl border-2 border-sc-border bg-sc-surface p-3 shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sc-gold">
                <SmartphoneNfc className="h-[18px] w-[18px] text-sc-gold-ink" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black leading-tight text-sc-text">
                  Want a card like {firstName}&apos;s?
                </p>
                <p className="truncate text-[11px] font-semibold leading-tight text-sc-text-dim">
                  One tap shares everything you do.
                </p>
              </div>

              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="shrink-0 p-1 text-sc-text-dimmer transition-colors hover:text-sc-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Two intents, because they're genuinely different people: some
                want the free page, some want the physical card in their hand. */}
            <div className="mt-2.5 flex gap-2">
              <Link
                href={referralTemplateUrl(template, refCode)}
                onClick={() => track("banner_click")}
                className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-sc-border px-3 py-2 text-center transition-colors hover:border-sc-gold/50"
              >
                <span className="text-[12px] font-black uppercase tracking-tight text-sc-text">
                  make mine
                </span>
                <span className="text-[10px] font-bold text-sc-text-dimmer">free</span>
              </Link>

              <Link
                href={referralOrderUrl(refCode)}
                onClick={() => track("order")}
                className="flex flex-1 flex-col items-center justify-center rounded-xl bg-sc-gold px-3 py-2 text-center"
              >
                <span className="flex items-center gap-1 text-[12px] font-black uppercase tracking-tight text-sc-gold-ink">
                  order a card
                  <ArrowRight className="h-3 w-3" />
                </span>
                {cardPrice ? (
                  <span className="text-[10px] font-bold text-sc-gold-ink/70">
                    from Rs.{cardPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-sc-gold-ink/70">
                    posted to you
                  </span>
                )}
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {shown === "pill" && (
        <motion.button
          key="pill"
          type="button"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={SPRING}
          onClick={() => setShown("full")}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border-2 border-sc-gold bg-sc-gold px-4 py-2.5 text-[12px] font-black uppercase tracking-tight text-sc-gold-ink shadow-[0_6px_20px_rgba(0,0,0,0.45)] mb-[env(safe-area-inset-bottom)]"
        >
          <SmartphoneNfc className="h-4 w-4" />
          get a card
        </motion.button>
      )}
    </AnimatePresence>
  );
}
