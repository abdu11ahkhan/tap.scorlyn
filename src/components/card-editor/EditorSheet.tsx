"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Full-screen drill-down for one editor section (profile details, links,
 * photos, payment, extras…). Tapping a row in the Content tab opens this
 * instead of expanding an accordion in place — on a long multi-section tab,
 * "collapsed but still in the list" still meant scrolling past however many
 * sections came before the one you wanted. Opening it as its own screen
 * means there is only ever one section's worth of fields on screen, on any
 * width — not just on a phone, which is why this has no lg: breakpoint.
 */
export default function EditorSheet({
  open,
  title,
  hint,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  hint?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-sc-bg"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sc-border-soft bg-sc-surface px-3 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close and go back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sc-text-dim hover:bg-sc-surface-2 hover:text-sc-text"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-black text-sc-text">{title}</p>
          {hint && <p className="truncate text-xs font-semibold text-sc-text-dim">{hint}</p>}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
        {children}
      </div>
    </div>
  );
}
