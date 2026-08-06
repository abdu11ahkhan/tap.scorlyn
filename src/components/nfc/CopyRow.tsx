"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * One bank detail, tappable to copy.
 *
 * An account number read off a screen and typed into a banking app is where
 * money goes to the wrong person, so the whole row is the target rather than a
 * small icon.
 */
export default function CopyRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      return;
    } catch {
      // Clipboard API needs a secure context and permission. Fall back to the
      // old execCommand path so this still works on stricter mobile browsers.
    }

    try {
      const scratch = document.createElement("textarea");
      scratch.value = value;
      scratch.setAttribute("readonly", "");
      scratch.style.position = "fixed";
      scratch.style.opacity = "0";
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand("copy");
      scratch.remove();
      setCopied(true);
    } catch {
      // Nothing else to try — the number is still on screen to read.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}: ${value}`}
      className="-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/[0.04] active:bg-black/[0.07]"
    >
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-black/35">
        {label}
      </span>

      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-[13px] font-semibold text-black/80">
          {value}
        </span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 text-black/25" />
        )}
      </span>
    </button>
  );
}
