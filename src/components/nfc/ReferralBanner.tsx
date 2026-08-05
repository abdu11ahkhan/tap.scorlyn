"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SmartphoneNfc, X } from "lucide-react";
import { referralSignupUrl } from "@/lib/referral";

/**
 * The viral loop. Sticky bottom CTA shown to anyone who opens someone else's
 * card: "want one like this?".
 *
 * No notification permission involved — this is the Option 2 approach that
 * actually works on every phone. Dismissal is remembered per browser so a
 * repeat visitor isn't nagged.
 */
export default function ReferralBanner({
  refCode,
  cardProfileId,
  ownerName,
}: {
  refCode: string | null;
  cardProfileId: string;
  ownerName: string;
}) {
  const [visible, setVisible] = useState(false);

  const dismissKey = "tapzar_banner_dismissed";

  useEffect(() => {
    if (localStorage.getItem(dismissKey)) return;

    // Let the card land first — an instant banner reads as a popup ad.
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible || !refCode) return;
    track("banner_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, refCode]);

  const track = (eventType: "banner_view" | "banner_click") => {
    if (!refCode) return;
    fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refCode, cardProfileId, eventType }),
      keepalive: true,
    }).catch(() => {});
  };

  const dismiss = () => {
    localStorage.setItem(dismissKey, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed bottom-0 inset-x-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto max-w-md flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0A0D14]/95 backdrop-blur-xl p-3 pl-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
              <SmartphoneNfc className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white leading-tight">
                Want a card like {ownerName.split(" ")[0]}&apos;s?
              </p>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                One tap. Your whole profile.
              </p>
            </div>

            <Link
              href={referralSignupUrl(refCode)}
              onClick={() => track("banner_click")}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-gray-200 transition-colors"
            >
              Get yours
            </Link>

            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 p-1.5 -ml-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
