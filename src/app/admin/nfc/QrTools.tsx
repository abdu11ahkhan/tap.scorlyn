"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Link2, Loader2 } from "lucide-react";
import { qrPngBlob, qrSvg } from "@/lib/qr";

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black lowercase text-sc-text transition-colors hover:border-acid hover:text-acid disabled:opacity-50";

/**
 * The QR for one physical card, and every way to get it out: clipboard for
 * pasting into a design, PNG for quick use, SVG for CorelDRAW, vector PDF for
 * a print shop. All generated in the browser from the permanent URL.
 */
export default function QrTools({ url, serial }: { url: string; serial: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    qrSvg(url).then(setSvg).catch(() => setError("Could not draw the QR."));
  }, [url]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(null), 1800);
    return () => clearTimeout(t);
  }, [done]);

  const run = (key: string, fn: () => Promise<void>) => async () => {
    setError(null);
    setBusy(key);
    try {
      await fn();
      setDone(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const icon = (key: string, Idle: typeof Copy) =>
    busy === key ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : done === key ? (
      <Check className="h-4 w-4" strokeWidth={3} />
    ) : (
      <Idle className="h-4 w-4" />
    );

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-[320px] rounded-2xl border-2 border-sc-border-soft bg-white p-3">
        {svg ? (
          // Trusted: generated locally by the qrcode library from our own URL.
          <div
            className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label={`QR code for ${serial}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-black/30" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className={BTN}
          disabled={!!busy}
          onClick={run("copy-qr", async () => {
            if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
              throw new Error("This browser can't copy images — use Download PNG instead.");
            }
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": qrPngBlob(url, 1200) }),
            ]);
          })}
        >
          {icon("copy-qr", Copy)} copy qr
        </button>
        <button
          type="button"
          className={BTN}
          disabled={!!busy}
          onClick={run("png", async () => saveBlob(await qrPngBlob(url, 2000), `${serial}.png`))}
        >
          {icon("png", Download)} png
        </button>
        <button
          type="button"
          className={BTN}
          disabled={!!busy || !svg}
          onClick={run("svg", async () =>
            saveBlob(new Blob([svg ?? (await qrSvg(url))], { type: "image/svg+xml" }), `${serial}.svg`)
          )}
        >
          {icon("svg", Download)} svg
        </button>
        <button
          type="button"
          className={BTN}
          disabled={!!busy}
          onClick={run("pdf", async () => {
            const { qrPdf } = await import("@/lib/qr-pdf");
            const bytes = await qrPdf(url, serial, url.replace(/^https?:\/\//, ""));
            saveBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${serial}.pdf`);
          })}
        >
          {icon("pdf", Download)} pdf
        </button>
        <button
          type="button"
          className={BTN}
          disabled={!!busy}
          onClick={run("url", async () => {
            await navigator.clipboard.writeText(url);
          })}
        >
          {icon("url", Link2)} copy url
        </button>
      </div>

      {error && <p className="text-center text-xs font-bold text-hotpink">{error}</p>}
    </div>
  );
}
