"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";

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
}: {
  url: string;
  name: string;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const message = `${name} — ${url}`;

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // Cancelled, or blocked — fall through to the manual panel.
      }
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
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
        className="fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border-2 border-black/10 bg-white/90 text-black shadow-lg backdrop-blur transition-transform active:scale-95"
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
                className="text-black/40 hover:text-black"
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
