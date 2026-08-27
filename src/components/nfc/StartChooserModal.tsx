"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid, Sparkles, X, Zap } from "lucide-react";

const OPTIONS = [
  {
    href: "/templates",
    icon: LayoutGrid,
    title: "build your online profile",
    blurb: "Every link, bio and photo — one page for a tap to open. The classic ScorlynTap card.",
    cta: "browse templates",
  },
  {
    href: "/single/new",
    icon: Sparkles,
    title: "design a single-purpose card",
    blurb: "WhatsApp, a review link, your menu — a tap does one thing. Pick a template and customise it.",
    cta: "pick a purpose",
  },
  {
    href: "/dashboard/quick-order",
    icon: Zap,
    title: "order an nfc card directly",
    blurb: "Skip the design step — just tell us where it should go and pick a finish. Fastest way to a physical card.",
    cta: "order now",
  },
] as const;

/**
 * The fork every "get started" button opens onto: build an online profile,
 * design a single-purpose card, or skip straight to ordering a physical one.
 *
 * Used to be one button straight to /templates, which only ever built a
 * profile — the other two paths had no way in from these entry points.
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
      aria-label="What kind of card do you want to build?"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-ink/60 backdrop-blur-sm"
      />

      <div
        className="sticker-lg relative w-full max-w-lg rounded-t-3xl bg-white p-6 pb-8 sm:rounded-3xl sm:p-8"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink transition-colors hover:bg-ink/10"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ink-dim">
          get started
        </p>
        <h2 className="mt-1.5 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          three ways in.
        </h2>

        <div className="mt-6 space-y-3">
          {OPTIONS.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              onClick={onClose}
              className="group flex items-center gap-4 rounded-2xl border-2 border-line bg-mist p-4 text-left transition-colors hover:border-teal hover:bg-teal/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                <option.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-black lowercase text-ink">{option.title}</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-ink-dim">
                  {option.blurb}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-dim transition-transform group-hover:translate-x-1 group-hover:text-teal" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
