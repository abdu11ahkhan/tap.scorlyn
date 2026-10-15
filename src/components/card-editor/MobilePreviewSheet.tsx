"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Full-screen preview overlay for phones.
 *
 * The editor used to render its live preview inline, below the whole form —
 * on a phone that meant a second full page of scrolling just to see what you
 * just typed, and the preview sat there taking up screen space whether you
 * were looking at it or not. This opens it on request instead, over the
 * editor, with one obvious way back.
 *
 * Desktop never uses this — the side-by-side layout there already shows the
 * preview without trading away the editing column.
 */
export default function MobilePreviewSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
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
      className="fixed inset-0 z-[70] flex flex-col bg-sc-bg lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Preview your card"
    >
      <div
        className="flex h-14 shrink-0 items-center justify-between border-b border-sc-border-soft bg-sc-surface px-4 pt-[env(safe-area-inset-top)]"
      >
        <p className="text-sm font-bold text-sc-text">Preview</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full text-sc-text-dim hover:bg-sc-surface-2 hover:text-sc-text"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
        {children}
      </div>
    </div>
  );
}
