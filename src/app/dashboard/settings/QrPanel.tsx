"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, QrCode, Share2, Wallet } from "lucide-react";
import { useClientValue } from "@/lib/use-client-value";

/**
 * "Share your card": the link, the native share sheet, the QR (shown large
 * on demand and downloadable) and Google Wallet — every way to hand the card
 * over, in one panel.
 *
 * The QR is rendered to a canvas rather than SVG so the download is a real
 * PNG people can drop into a poster or a WhatsApp status. Drawn at 1024px
 * off-screen and displayed small, so the saved file is print-usable rather
 * than a blurry upscale of a small preview.
 */
const EXPORT_SIZE = 1024;

export default function QrPanel({
  username,
  cardId,
  wallet = false,
}: {
  username: string;
  /** Which card the Wallet pass is for; omitted means the account's first. */
  cardId?: string;
  wallet?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bigQr, setBigQr] = useState(false);

  const origin = useClientValue(() => window.location.origin, "");
  const url = origin ? `${origin}/u/${username}` : "";

  const download = () => {
    setFailed(false);

    const canvas = holder.current?.querySelector("canvas");
    if (!canvas) {
      setFailed(true);
      return;
    }

    // A Blob, not canvas.toDataURL(). At 1024px the data URL is over a
    // megabyte, and mobile Safari refuses to navigate to one that big — the
    // button appeared to do nothing at all. The anchor also has to be in the
    // document: a detached one is ignored by several browsers.
    canvas.toBlob((blob) => {
      if (!blob) {
        setFailed(true);
        return;
      }

      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `scorlyntap-${username}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(href), 10_000);
    }, "image/png");
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

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My digital card", url });
        return;
      } catch {
        // Cancelled or unsupported mid-call — fall through to copy.
      }
    }
    copy();
  };

  return (
    <section className="app-panel app-panel-pad">
      <h2 className="text-[15px] font-semibold text-sc-text">Share your card</h2>
      <p className="app-sub mt-1">Send the link, let them scan the QR, or keep it in your phone&apos;s wallet.</p>

      <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl bg-sc-surface-2 py-1.5 pl-4 pr-1.5">
        <p className="min-w-0 flex-1 truncate font-mono text-[13px] text-sc-text">{url || "…"}</p>
        <button type="button" onClick={copy} className="app-btn app-btn-ghost min-h-10 shrink-0">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={share} className="app-btn app-btn-primary min-h-12 justify-center">
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button
          type="button"
          onClick={() => setBigQr((v) => !v)}
          aria-expanded={bigQr}
          className="app-btn app-btn-ghost min-h-12 justify-center"
        >
          <QrCode className="h-4 w-4" />
          {bigQr ? "Hide QR" : "Show QR"}
        </button>
        <button type="button" onClick={download} className="app-btn app-btn-ghost min-h-12 justify-center">
          <Download className="h-4 w-4" />
          Download QR
        </button>
        {/* A plain anchor: the route mints a signed token and redirects to
            Google, which client-side navigation can't follow. */}
        {wallet ? (
          <a
            href={cardId ? `/api/wallet/google?id=${encodeURIComponent(cardId)}` : "/api/wallet/google"}
            className="app-btn min-h-12 justify-center rounded-xl bg-black text-white hover:bg-neutral-800"
          >
            <Wallet className="h-4 w-4" />
            Google Wallet
          </a>
        ) : null}
      </div>

      {bigQr && url && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-white p-5">
          <QRCodeCanvas value={url} size={232} bgColor="#ffffff" fgColor="#0a0a0a" level="M" />
          <p className="text-center text-[12px] font-semibold text-neutral-600">Point a phone camera here to open your card</p>
        </div>
      )}

      {wallet && (
        <p className="mt-3 text-[12px] text-sc-text-dim">
          Google Wallet keeps this QR on your phone for when you don&apos;t have the card with you.
        </p>
      )}

      {failed && (
        <p className="mt-2 text-[12px] font-semibold text-sc-error">
          Couldn&apos;t save the QR. Tap &ldquo;Show QR&rdquo;, then long-press it and choose &ldquo;Save image&rdquo;.
        </p>
      )}

      {/* Hidden high-resolution copy — this is what actually gets saved. */}
      <div ref={holder} className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
        {url && (
          <QRCodeCanvas value={url} size={EXPORT_SIZE} bgColor="#ffffff" fgColor="#0a0a0a" level="M" marginSize={2} />
        )}
      </div>
    </section>
  );
}
