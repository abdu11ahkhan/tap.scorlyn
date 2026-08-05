"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";

/**
 * Downloadable QR for the public card.
 *
 * Rendered to a canvas rather than SVG so the download is a real PNG people
 * can drop into a poster or a WhatsApp status. Drawn at 1024px off-screen and
 * displayed small, so the saved file is print-usable rather than a blurry
 * upscale of a 160px preview.
 */
const EXPORT_SIZE = 1024;

export default function QrPanel({ username }: { username: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const url = origin ? `${origin}/u/${username}` : "";

  const download = () => {
    const canvas = holder.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tapzar-${username}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
    <section className="app-panel app-panel-pad">
      <h2 className="text-[15px] font-semibold text-white">Your card link</h2>
      <p className="app-sub mt-1">Share it anywhere, or print the QR.</p>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="rounded-xl bg-white p-3">
          {url && (
            <QRCodeCanvas value={url} size={104} bgColor="#ffffff" fgColor="#0a0a0a" level="M" />
          )}
        </div>

        <div className="min-w-[200px] flex-1">
          <p className="break-all font-mono text-[13px] text-white/70">{url || "…"}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="app-btn app-btn-ghost">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" onClick={download} className="app-btn app-btn-primary">
              <Download className="h-3.5 w-3.5" />
              Download QR
            </button>
          </div>
        </div>
      </div>

      {/* Hidden high-resolution copy — this is what actually gets saved. */}
      <div ref={holder} className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
        {url && (
          <QRCodeCanvas
            value={url}
            size={EXPORT_SIZE}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
            level="M"
            marginSize={2}
          />
        )}
      </div>
    </section>
  );
}
