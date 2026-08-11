"use client";

import { useState } from "react";
import { ClipboardPaste, Check } from "lucide-react";
import { parseLinks } from "@/lib/parse-links";
import { defaultLabelFor, type CardButton } from "@/lib/card";

/**
 * Paste everything at once and let it sort itself out.
 *
 * Adding links one field at a time is the slowest part of building a card,
 * and people do not keep them in a tidy list — they arrive as a WhatsApp
 * message, an email signature, a Notes page. This takes the whole block,
 * works out what each line is, and files it under the right kind with the
 * right icon and label.
 */
export default function PasteLinks({
  buttons,
  onButtonsChange,
}: {
  buttons: CardButton[];
  onButtonsChange: (next: CardButton[]) => void;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(
    null
  );

  const found = text.trim() ? parseLinks(text, buttons) : [];
  const fresh = found.filter((link) => !link.duplicate);

  const add = () => {
    if (fresh.length === 0) return;
    onButtonsChange([
      ...buttons,
      ...fresh.map((link) => ({
        // The label follows the kind, so a pasted Instagram URL arrives
        // reading "Instagram" rather than the raw address.
        label: defaultLabelFor(link.kind),
        kind: link.kind,
        value: link.value,
      })),
    ]);
    setResult({ added: fresh.length, skipped: found.length - fresh.length });
    setText("");
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-white/15 p-4">
      <div className="flex items-start gap-2.5">
        <ClipboardPaste className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
        <div className="min-w-0">
          <p className="text-sm font-black text-white">Paste all your links at once</p>
          <p className="mt-0.5 text-xs font-semibold text-white/45">
            Drop in a message, an email signature, or a list. We work out
            which is which and put each one in the right place.
          </p>
        </div>
      </div>

      <textarea
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        placeholder={
          "instagram.com/yourname\nlinkedin.com/in/yourname\nyou@company.com\n0300 1234567"
        }
        className="mt-3 w-full rounded-xl border-2 border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-white placeholder:text-white/25 focus-visible:border-acid focus-visible:outline-none"
      />

      {/* What will happen, before it happens — so nothing is added by
          surprise and a mis-detected line can be spotted first. */}
      {found.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {found.map((link, index) => (
            <span
              key={index}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                link.duplicate
                  ? "bg-white/5 text-white/35 line-through"
                  : "bg-acid/15 text-acid"
              }`}
              title={link.value}
            >
              {defaultLabelFor(link.kind)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={fresh.length === 0}
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink bg-acid px-4 text-xs font-black uppercase tracking-tight text-ink disabled:opacity-40"
        >
          {fresh.length > 0
            ? `Add ${fresh.length} link${fresh.length === 1 ? "" : "s"}`
            : "Add links"}
        </button>

        {found.length > fresh.length && (
          <span className="text-xs font-semibold text-white/45">
            {found.length - fresh.length} already on your card
          </span>
        )}

        {result && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-acid">
            <Check className="h-3.5 w-3.5" />
            Added {result.added}
            {result.skipped > 0 && `, skipped ${result.skipped} already there`}
          </span>
        )}
      </div>
    </div>
  );
}
