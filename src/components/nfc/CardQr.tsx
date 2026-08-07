"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, X, UserPlus, Download } from "lucide-react";
import { buildVCard, vcardFilename, type VCardSource } from "@/lib/vcard";

/**
 * A QR code for the card, plus saving the contact — for every template.
 *
 * Rendered once around the templates rather than inside each of them: this is
 * the same gesture in all thirty-six, and threading it through each one would
 * be thirty-six chances to forget.
 *
 * A tap is the primary way this card is handed over, but plenty of phones will
 * not read a tag, and often the card is being shown on a screen rather than
 * held out — the QR covers both without cluttering the card until asked for.
 */
export default function CardQr({
  card,
  url,
  tone,
  accent,
}: {
  card: VCardSource;
  /** Public address of this card. Falls back to the current page. */
  url?: string;
  /** The template's background, so the trigger sits on its own page. */
  tone: string;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState(url ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!url) setHref(window.location.href.split("?")[0]);
  }, [url]);

  // Escape closes, and the page behind must not scroll under the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dark = isDark(tone);

  /**
   * Hands the vCard to the phone rather than downloading a file.
   *
   * A blob download lands in Files on iOS and the person still has to find it
   * and open it. Navigating to a real `text/vcard` URL instead lets the OS
   * recognise it, so iOS opens the contact card with "Add to Contacts" and
   * Android hands it to Contacts directly — one tap, actually saved.
   *
   * Falls back to the blob when there is no published address to point at,
   * which is the case in the editor preview and the template gallery.
   */
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);

    const username = (card as { username?: string }).username;
    // Same test the template button uses: only the public card route is
    // backed by /api/vcard, which can see published rows only.
    const published =
      Boolean(username) && window.location.pathname.startsWith("/u/");

    if (published) {
      window.location.href = `/api/vcard/${encodeURIComponent(username as string)}`;
      return;
    }

    const blob = new Blob([buildVCard(card, window.location.origin)], {
      type: "text/vcard;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = vcardFilename(card);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  };

  const downloadQr = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#card-qr-canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${(card as { username?: string }).username ?? "card"}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    }, "image/png");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show QR code"
        // Bottom-centre: the share control sits top-right and the logo
        // watermark bottom-left, so this is the one place left that a thumb
        // reaches without covering anything.
        className="fixed bottom-4 left-1/2 z-30 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-[13px] font-bold shadow-lg backdrop-blur-md transition-transform active:scale-95"
        style={{
          background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.075)",
          color: dark ? "#fff" : "#111",
          border: `1px solid ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)"}`,
        }}
      >
        <QrCode className="h-4 w-4" />
        QR code
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="QR code"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
          />

          <div
            className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 pb-8 text-[#111] sm:rounded-3xl sm:pb-6"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40">
              scan to open
            </p>
            <p className="mt-1 truncate text-[15px] font-bold">{card.full_name}</p>

            <div className="mt-5 flex justify-center rounded-2xl bg-white p-4 ring-1 ring-black/10">
              {href && (
                <QRCodeCanvas
                  id="card-qr-canvas"
                  value={href}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                  level="M"
                  includeMargin
                />
              )}
            </div>

            <p className="mt-3 break-all text-center text-[12px] font-semibold text-black/40">
              {href.replace(/^https?:\/\//, "")}
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={save}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold"
                style={{ background: accent, color: readableOn(accent) }}
              >
                <UserPlus className="h-4 w-4" />
                {saved ? "Opening contacts…" : "Save to contacts"}
              </button>

              <button
                type="button"
                onClick={downloadQr}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black/12 text-[15px] font-bold"
              >
                <Download className="h-4 w-4" />
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Duplicated from lib/card so this stays usable without a server import. */
function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.4;
}

function readableOn(hex: string): string {
  return isDark(hex) ? "#ffffff" : "#0a0a0a";
}
