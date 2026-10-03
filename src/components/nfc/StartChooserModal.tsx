"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Camera, LayoutGrid, Nfc, X, Zap } from "lucide-react";

const OPTIONS = [
  {
    href: "/templates",
    icon: LayoutGrid,
    title: "Start with a design",
    blurb: "Pick one of 44 designs, then add your details. You can switch design any time.",
  },
  {
    href: "/templates/scan",
    icon: Camera,
    title: "Use my business card",
    blurb: "Take a photo of your paper card — we fill in your name, number and links for you.",
  },
] as const;

/**
 * What every "get started" button opens: one decision — how to start the
 * card. One-link cards and ordering a card directly are still here, but as
 * quieter options underneath, not as equal first choices.
 */
export default function StartChooserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Create your Scorlyn card"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-ink/60 backdrop-blur-sm"
      />

      <div
        className="brut relative w-full max-w-lg rounded-t-3xl bg-cream p-6 pb-8 text-char sm:rounded-3xl sm:p-8"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border-2 border-char bg-white text-char transition-colors hover:bg-sun-soft"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="display pr-12 text-[clamp(2.4rem,9vw,3.4rem)] text-char">
          Create your <span className="text-sea">Scorlyn</span> card
        </h2>
        <p className="mt-2 text-[15px] font-semibold text-char/70">Free to make. How do you want to start?</p>

        <div className="mt-6 space-y-3">
          {OPTIONS.map((option, i) => (
            <Link
              key={option.href}
              href={option.href}
              onClick={onClose}
              className={`brut-sm brut-press group flex items-center gap-4 rounded-2xl p-4 text-left ${i === 0 ? "bg-sun" : "bg-white"}`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-char bg-white text-char">
                <option.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-black text-char">{option.title}</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-snug text-char/70">{option.blurb}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-char transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-1 border-t-2 border-char/15 pt-4">
          <Link
            href="/single/new"
            onClick={onClose}
            className="flex min-h-11 items-center gap-2.5 text-[14px] font-bold text-char/80 hover:text-char"
          >
            <Zap className="h-4 w-4 shrink-0 text-sea" />
            Just need a card that opens one link (WhatsApp, Instagram, reviews)?
          </Link>
          <Link
            href="/dashboard/quick-order"
            onClick={onClose}
            className="flex min-h-11 items-center gap-2.5 text-[14px] font-bold text-char/80 hover:text-char"
          >
            <Nfc className="h-4 w-4 shrink-0 text-sea" />
            Skip the design — order an NFC card directly
          </Link>
        </div>
      </div>
    </div>
  );
}
