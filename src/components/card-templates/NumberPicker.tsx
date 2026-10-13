"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { NUMBER_PICKER_HREF, type ResolvedButton } from "@/lib/card";

/**
 * The "which number?" sheet for a grouped Call / WhatsApp button (see
 * groupNumberButtons). Templates render that button as an ordinary <a> whose
 * href is #scorlyn-pick-<kind>; one delegated listener here catches the tap,
 * so none of the templates need to know the picker exists.
 *
 * The choices are real tel: / wa.me links, so OutboundClickTracker counts
 * them exactly like a single-number button.
 */
export default function NumberPicker({ buttons }: { buttons: ResolvedButton[] }) {
  const groups = buttons.filter((b) => b.choices && b.choices.length > 1);
  const [open, setOpen] = useState<ResolvedButton | null>(null);
  const firstRef = useRef<HTMLAnchorElement>(null);
  // Listens on whichever document it is rendered into — the page itself, or
  // the editor's preview iframe, where the sheet then opens inside the phone.
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!groups.length) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href") ?? "";
      if (!href.startsWith(NUMBER_PICKER_HREF)) return;
      const group = groups.find((g) => g.href === href);
      if (!group) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(group);
    };
    const doc = anchorRef.current?.ownerDocument ?? document;
    doc.addEventListener("click", onClick, true);
    return () => doc.removeEventListener("click", onClick, true);
  }, [groups]);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    const doc = anchorRef.current?.ownerDocument ?? document;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    doc.addEventListener("keydown", onKey);
    return () => doc.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open?.choices) return <span ref={anchorRef} hidden />;
  const whatsapp = open.kind === "whatsapp";
  const Icon = whatsapp ? MessageCircle : Phone;

  return (
    <div ref={anchorRef as unknown as React.RefObject<HTMLDivElement>} className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="number-picker-title">
      <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute inset-0 h-full w-full bg-black/55" />
      <div
        className="relative w-full max-w-sm rounded-t-3xl bg-white p-5 text-neutral-900 shadow-2xl sm:rounded-3xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p id="number-picker-title" className="text-[17px] font-bold">
            {whatsapp ? "WhatsApp which number?" : "Call which number?"}
          </p>
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-2">
          {open.choices.map((c, i) => (
            <li key={c.href}>
              <a
                ref={i === 0 ? firstRef : undefined}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(null)}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-2 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    whatsapp ? "bg-[#25D366] text-white" : "bg-neutral-900 text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{c.label}</span>
                  {c.label !== c.number && <span className="block truncate text-[13px] text-neutral-500">{c.number}</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
