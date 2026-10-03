"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

/**
 * Copy a card's activation code — or a ready-to-send message with the
 * card's link and code, for pasting into WhatsApp. Whoever enters the code
 * activates the card instantly, with no approval step.
 */
export default function CopyCode({ code, link, compact = false }: { code: string; link?: string; compact?: boolean }) {
  const [copied, setCopied] = useState<"code" | "msg" | null>(null);

  const copy = async (what: "code" | "msg") => {
    const text =
      what === "code"
        ? code
        : `Your ScorlynTap card is ready to set up.\n\n1. Scan the QR on your card (or open ${link})\n2. Sign up with your email\n3. Enter activation code: ${code}\n\nThen choose what your card opens. That's it!`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard needs a secure context; the code is on screen to copy by hand.
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => copy("code")}
        title="Copy activation code"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border-2 border-sc-border-soft px-2 font-mono text-[12px] font-black tracking-widest text-sc-text hover:border-acid"
      >
        {code}
        {copied ? <Check className="h-3.5 w-3.5 text-acid" /> : <Copy className="h-3.5 w-3.5 text-sc-text-dimmer" />}
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" onClick={() => copy("code")} className="app-btn app-btn-ghost min-h-11">
        {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied === "code" ? "Copied" : "Copy code"}
      </button>
      {link && (
        <button type="button" onClick={() => copy("msg")} className="app-btn app-btn-ghost min-h-11">
          {copied === "msg" ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          {copied === "msg" ? "Copied" : "Copy message for customer"}
        </button>
      )}
    </div>
  );
}
