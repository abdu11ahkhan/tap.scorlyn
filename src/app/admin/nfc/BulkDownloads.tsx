"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { saveBlob } from "./QrTools";

export type ExportCard = {
  serial: string;
  url: string;
  code: string;
  batchId: string | null;
  batch: string | null;
  status: string;
  /** Printed on the packaging; lets the buyer activate without waiting for approval. */
  activation: string;
};

const BTN =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black lowercase text-sc-text transition-colors hover:border-acid hover:text-acid disabled:opacity-50";

function csvCell(value: string | null) {
  const v = value ?? "";
  // Leading =,+,-,@ would run as a formula when the CSV is opened in Excel.
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Every QR for the cards currently listed, zipped in the browser — generating
 * 500 PNGs server-side would run into function time limits, and this way
 * nothing but the card list crosses the network. No customer data goes into
 * any of these files: code, URL, batch and status only.
 */
export default function BulkDownloads({ cards, label }: { cards: ExportCard[]; label: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cards";

  const zip = async (kind: "png" | "svg") => {
    setError(null);
    setBusy(kind);
    setProgress(0);
    try {
      const [{ zipSync, strToU8 }, qr] = await Promise.all([import("fflate"), import("@/lib/qr")]);
      const files: Record<string, Uint8Array> = {};
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        if (kind === "svg") {
          files[`${c.serial}.svg`] = strToU8(await qr.qrSvg(c.url));
        } else {
          const blob = await qr.qrPngBlob(c.url, 1200);
          files[`${c.serial}.png`] = new Uint8Array(await blob.arrayBuffer());
        }
        if (i % 20 === 0) setProgress(Math.round((i / cards.length) * 100));
      }
      // PNGs are already compressed; level 0 just stores them, much faster.
      const out = zipSync(files, { level: kind === "png" ? 0 : 6 });
      saveBlob(new Blob([out as BlobPart], { type: "application/zip" }), `${slug}-${kind}.zip`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the ZIP.");
    } finally {
      setBusy(null);
    }
  };

  const csv = () => {
    const rows = [
      ["Card ID", "Permanent URL", "Token", "Activation code", "Batch ID", "Batch", "Status"],
      ...cards.map((c) => [c.serial, c.url, c.code, c.activation, c.batchId, c.batch, c.status]),
    ];
    const text = rows.map((r) => r.map((v) => csvCell(v)).join(",")).join("\n");
    saveBlob(new Blob([`﻿${text}`], { type: "text/csv;charset=utf-8" }), `${slug}.csv`);
  };

  if (cards.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={BTN} disabled={!!busy} onClick={() => zip("png")}>
        {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy === "png" ? `png zip ${progress}%` : "png zip"}
      </button>
      <button type="button" className={BTN} disabled={!!busy} onClick={() => zip("svg")}>
        {busy === "svg" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy === "svg" ? `svg zip ${progress}%` : "svg zip"}
      </button>
      <button type="button" className={BTN} disabled={!!busy} onClick={csv}>
        <FileSpreadsheet className="h-4 w-4" /> csv
      </button>
      <span className="text-xs font-semibold text-sc-text-dimmer">
        {cards.length} card{cards.length === 1 ? "" : "s"}
      </span>
      {error && <span className="w-full text-xs font-bold text-hotpink">{error}</span>}
    </div>
  );
}
