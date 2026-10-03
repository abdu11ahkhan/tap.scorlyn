"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, ExternalLink, Nfc, Palette, Share2, X } from "lucide-react";

/**
 * The moment a card first goes live. States the fact, hands over the link
 * and QR, and makes the physical NFC card the obvious next step — with a
 * plain "Maybe later" so it never feels like a paywall.
 */
export default function PublishedSheet({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard needs a secure context; the link is on screen to copy by hand.
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My digital card", url });
        return;
      } catch {
        // Cancelled — fall through to copy.
      }
    }
    copy();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="published-title">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 h-full w-full bg-black/60" />

      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-2 border-sc-border bg-sc-bg p-6 sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-sc-text-dim hover:bg-sc-surface-2"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-3xl" aria-hidden>
          🎉
        </p>
        <h2 id="published-title" className="mt-2 text-2xl font-black leading-tight text-sc-text">
          Your Scorlyn card is live
        </h2>
        <p className="app-sub mt-1">Anyone with your link or QR can open it now.</p>

        <div className="mt-5 flex items-center gap-4">
          <div className="shrink-0 rounded-xl bg-white p-2">
            <QRCodeSVG value={url} size={92} level="M" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate font-mono text-[13px] font-semibold text-sc-text">{display}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={share} className="app-btn app-btn-primary min-h-11">
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button type="button" onClick={copy} className="app-btn app-btn-ghost min-h-11">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="app-btn app-btn-ghost min-h-11">
                <ExternalLink className="h-4 w-4" />
                View
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-sc-gold/50 bg-sc-gold/5 p-4">
          <p className="text-[16px] font-black text-sc-text">Get your physical Scorlyn card</p>
          <p className="mt-1 text-[13.5px] text-sc-text-dim">
            Your digital card is ready. Put it on an NFC card and share it with one tap — no app needed.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/dashboard/nfc" className="flex min-h-20 flex-col justify-center gap-1 rounded-xl border-2 border-sc-border-soft bg-sc-surface p-3 hover:border-sc-gold">
              <Nfc className="h-5 w-5 text-sc-gold-text" />
              <span className="text-[14px] font-black text-sc-text">Blank NFC card</span>
              <span className="text-[12px] font-semibold text-sc-text-dim">Rs. 1,600</span>
            </Link>
            <Link href="/dashboard/nfc" className="flex min-h-20 flex-col justify-center gap-1 rounded-xl border-2 border-sc-border-soft bg-sc-surface p-3 hover:border-sc-gold">
              <Palette className="h-5 w-5 text-sc-gold-text" />
              <span className="text-[14px] font-black text-sc-text">Custom printed</span>
              <span className="text-[12px] font-semibold text-sc-text-dim">Rs. 2,200</span>
            </Link>
          </div>
        </div>

        <button type="button" onClick={onClose} className="mt-4 min-h-11 w-full text-center text-sm font-bold text-sc-text-dim hover:text-sc-text">
          Maybe later
        </button>
      </div>
    </div>
  );
}
