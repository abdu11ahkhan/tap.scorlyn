"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { qrSvg } from "@/lib/qr";

export type PrintCard = { id: string; serial: string; url: string; nickname: string | null };

const PAPER = {
  a4: { label: "A4", css: "A4", width: 210 },
  letter: { label: "Letter", css: "letter", width: 215.9 },
} as const;

const CONTENT = [
  { id: "qr", label: "QR only" },
  { id: "qr-id", label: "QR + card ID" },
  { id: "qr-url", label: "QR + URL" },
  { id: "qr-id-url", label: "QR + card ID + URL" },
] as const;

const SIZES = [20, 25, 30, 40, 50, 60];
const MARGIN_MM = 10;
const GAP_MM = 4;

const CHIP =
  "inline-flex min-h-11 items-center rounded-full border-2 px-4 text-xs font-black lowercase transition-colors";
const on = "border-acid bg-acid text-ink";
const off = "border-sc-border text-sc-text-dim hover:border-acid hover:text-acid";

/**
 * Sheets of QR codes for cutting or for a printer's proof. Codes are inline
 * SVG, so they print as vectors at whatever size is picked — sizes are real
 * millimetres, so what you set is what comes out of the printer at 100%.
 */
export default function PrintSheet({ cards }: { cards: PrintCard[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(cards.map((c) => c.id)));
  const [paper, setPaper] = useState<keyof typeof PAPER>("a4");
  const [content, setContent] = useState<(typeof CONTENT)[number]["id"]>("qr-id");
  const [size, setSize] = useState(30);
  const [svgs, setSvgs] = useState<Record<string, string>>({});

  const chosen = useMemo(() => cards.filter((c) => selected.has(c.id)), [cards, selected]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = chosen.filter((c) => !svgs[c.id]);
      if (!missing.length) return;
      const next: Record<string, string> = {};
      for (const c of missing) next[c.id] = await qrSvg(c.url);
      if (!cancelled) setSvgs((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [chosen, svgs]);

  const cellWidth = size + 6;
  const usable = PAPER[paper].width - MARGIN_MM * 2;
  const columns = Math.max(1, Math.floor((usable + GAP_MM) / (cellWidth + GAP_MM)));
  const showId = content === "qr-id" || content === "qr-id-url";
  const showUrl = content === "qr-url" || content === "qr-id-url";
  const ready = chosen.every((c) => svgs[c.id]);

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          @page { size: ${PAPER[paper].css}; margin: ${MARGIN_MM}mm; }
          body * { visibility: hidden !important; }
          .print-root, .print-root * { visibility: visible !important; }
          .print-root { position: absolute; inset: 0 auto auto 0; width: ${usable}mm; background: #fff; }
        }
      `}</style>

      <div className="app-panel app-panel-pad space-y-4 print:hidden">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PAPER).map(([id, p]) => (
            <button key={id} type="button" onClick={() => setPaper(id as keyof typeof PAPER)} className={`${CHIP} ${paper === id ? on : off}`}>
              {p.label}
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-sc-border-soft" />
          {CONTENT.map((c) => (
            <button key={c.id} type="button" onClick={() => setContent(c.id)} className={`${CHIP} ${content === c.id ? on : off}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">qr size</span>
          {SIZES.map((s) => (
            <button key={s} type="button" onClick={() => setSize(s)} className={`${CHIP} ${size === s ? on : off}`}>
              {s}mm
            </button>
          ))}
          <span className="text-xs font-semibold text-sc-text-dimmer">
            {columns} per row · keep QR at 20mm or more for reliable scanning
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!chosen.length || !ready}
            onClick={() => window.print()}
            className="sticker sticker-press inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-6 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {ready ? <Printer className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            print {chosen.length} card{chosen.length === 1 ? "" : "s"}
          </button>
          <span className="text-xs font-semibold text-sc-text-dimmer">
            In the print dialog pick &quot;Save as PDF&quot; for a file, and set scale to 100%.
          </span>
        </div>
      </div>

      <details className="app-panel app-panel-pad print:hidden">
        <summary className="cursor-pointer text-sm font-black">
          choose cards ({chosen.length} of {cards.length} selected)
        </summary>
        <div className="mt-3 flex gap-2">
          <button type="button" className={`${CHIP} ${off}`} onClick={() => setSelected(new Set(cards.map((c) => c.id)))}>
            select all
          </button>
          <button type="button" className={`${CHIP} ${off}`} onClick={() => setSelected(new Set())}>
            select none
          </button>
        </div>
        <div className="mt-3 grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-3">
          {cards.map((c) => (
            <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-sc-surface-2">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--color-acid,#c8ff00)]"
                checked={selected.has(c.id)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(c.id);
                  else next.delete(c.id);
                  setSelected(next);
                }}
              />
              <span className="font-mono text-sm font-bold">{c.serial}</span>
              {c.nickname && <span className="truncate text-xs text-sc-text-dimmer">{c.nickname}</span>}
            </label>
          ))}
        </div>
      </details>

      <div className="overflow-x-auto rounded-2xl bg-white p-4">
        <div
          className="print-root mx-auto text-black"
          style={{
            width: `${usable}mm`,
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, ${cellWidth}mm)`,
            gap: `${GAP_MM}mm`,
            justifyContent: "start",
          }}
        >
          {chosen.map((c) => (
            <div
              key={c.id}
              style={{ width: `${cellWidth}mm`, breakInside: "avoid", padding: "3mm", border: "0.2mm dashed #bbb", textAlign: "center" }}
            >
              <div
                style={{ width: `${size}mm`, height: `${size}mm`, margin: "0 auto" }}
                className="[&>svg]:h-full [&>svg]:w-full"
                // Trusted: generated locally by the qrcode library.
                dangerouslySetInnerHTML={{ __html: svgs[c.id] ?? "" }}
              />
              {showId && (
                <div style={{ fontFamily: "ui-monospace, monospace", fontWeight: 800, fontSize: `${Math.max(7, size / 4.5)}pt`, marginTop: "1mm" }}>
                  {c.serial}
                </div>
              )}
              {showUrl && (
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: `${Math.max(5, size / 8)}pt`, wordBreak: "break-all", marginTop: "0.5mm" }}>
                  {c.url.replace(/^https?:\/\//, "")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
