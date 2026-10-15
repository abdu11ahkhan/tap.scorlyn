"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import { trackCardEvent } from "@/lib/track-event";

/**
 * Share control on a public card.
 *
 * Uses the native share sheet where the browser has one (every modern phone),
 * which is what people actually expect when they tap share. Falls back to
 * copy-link + a WhatsApp deep link on desktop, where navigator.share is
 * usually absent.
 */
export default function ShareButton({
  url,
  name,
  accent,
  username,
  tone = "#ffffff",
}: {
  url: string;
  name: string;
  accent: string;
  /** For the share event — optional so this still renders anywhere it's used without a published card behind it. */
  username?: string;
  /** The template's own background, so this reads on dark cards too — same
   *  tone CardQr's QR trigger already keys off, via extrasTone(card). */
  tone?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const message = `${name} — ${url}`;

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        if (username) trackCardEvent(username, "share");
        return;
      } catch {
        // Cancelled, or blocked — fall through to the manual panel. Not
        // counted as a share: a cancelled share sheet isn't a completed one.
      }
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (username) trackCardEvent(username, "share");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={share}
        aria-label="Share this card"
        className="fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={
          isDark(tone)
            ? { background: "rgba(255,255,255,0.14)", border: "2px solid rgba(255,255,255,0.2)", color: "#fff", outlineColor: "#fff" }
            : { background: "rgba(255,255,255,0.9)", border: "2px solid rgba(0,0,0,0.1)", color: "#111", outlineColor: "#111" }
        }
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-3xl border-2 border-black bg-white p-6 text-black">
            <div className="flex items-start justify-between">
              <p className="text-xl font-black tracking-tight">Share this card</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-m-2.5 flex h-11 w-11 items-center justify-center text-black/40 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-1 truncate font-mono text-xs text-black/45">{url}</p>

            <button
              type="button"
              onClick={copy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-black py-3.5 text-sm font-black"
            >
              {copied ? <Check className="h-4 w-4" strokeWidth={3} /> : <Copy className="h-4 w-4" />}
              {copied ? "copied" : "copy link"}
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => username && trackCardEvent(username, "share")}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-black text-white"
              style={{ background: accent }}
            >
              send on whatsapp
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/** Duplicated from lib/card (same as CardQr) so this stays usable without a server import. */
function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.4;
}
