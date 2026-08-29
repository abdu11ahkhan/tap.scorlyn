"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, X, UserPlus, Download } from "lucide-react";
import { buildVCard, vcardFilename, type VCardSource } from "@/lib/vcard";
import { trackCardEvent } from "@/lib/track-event";

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
 *
 * The dock publishes its own measured height as --sc-dock-offset, the same
 * pattern ReferralBanner uses for itself. It's always mounted now (this is
 * the card's one save/QR control), so anything else fixed to the bottom —
 * right now just the referral pill — reads the var to sit above it instead
 * of guessing a fixed offset that drifts the moment this dock's padding does.
 */
const DOCK_OFFSET_VAR = "--sc-dock-offset";
export default function CardQr({
  card,
  url,
  tone,
  accent,
  showQr = true,
}: {
  card: VCardSource;
  /** Public address of this card. Falls back to the current page. */
  url?: string;
  /** The template's background, so the trigger sits on its own page. */
  tone: string;
  accent: string;
  /** The owner can switch the QR off; saving the contact stays either way. */
  showQr?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState("");
  const [saved, setSaved] = useState(false);

  const href = url ?? resolved;

  const dockRef = useRef<HTMLDivElement>(null);

  // Measured rather than guessed, and republished on resize: the dock's
  // height changes with showQr (one button vs two) and with font-size zoom.
  useEffect(() => {
    const root = document.documentElement;
    const el = dockRef.current;
    if (!el) return;
    const publish = () => root.style.setProperty(DOCK_OFFSET_VAR, `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty(DOCK_OFFSET_VAR, "0px");
    };
  }, [showQr]);

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
    if (username) trackCardEvent(username, "contact_save");
    // Same test the template button uses: only the public card route is
    // backed by /api/vcard, which can see published rows only.
    const published =
      Boolean(username) && window.location.pathname.startsWith("/u/");

    // The visitor's own note (ReferenceNote renders separately, with no
    // shared React tree to pass state through) — read at click time so a
    // save from this dock carries it just like the in-template button does.
    let note = "";
    try {
      note = sessionStorage.getItem(`scorlyntap_ref_note:${username ?? ""}`) ?? "";
    } catch {
      // Private browsing / storage blocked — the save still works.
    }
    note = note.trim();

    if (published) {
      const base = `/api/vcard/${encodeURIComponent(username as string)}`;
      window.location.href = note ? `${base}?note=${encodeURIComponent(note)}` : base;
      return;
    }

    const blob = new Blob([buildVCard(card, window.location.origin, note)], {
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
      {/* The persistent dock.
          Every template also carries its own "save to contacts", but that one
          scrolls away with the layout — and on a long card (gallery, menu,
          case study) the visitor is usually somewhere in the middle when they
          decide to keep the contact. This stays put, so the primary action of
          the whole card is never more than a thumb-reach away.

          Bottom-centre: the share control sits top-right and the logo
          watermark bottom-left, so this is the one place left that a thumb
          reaches without covering anything — except the referral banner,
          which also docks to the bottom and is taller. The bottom offset
          reads a CSS var ReferralBanner publishes with its measured height,
          so this lifts clear of it instead of being covered. It sits above
          the logo watermark's z-30 so a wide logo can never obscure it. */}
      <div
        ref={dockRef}
        className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
        style={{ bottom: "calc(1rem + var(--sc-referral-offset, 0px))" }}
      >
        <div
          className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-full p-1.5 shadow-lg backdrop-blur-md"
          style={{
            background: dark ? "rgba(20,20,20,0.72)" : "rgba(255,255,255,0.82)",
            border: `1px solid ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)"}`,
          }}
        >
          <button
            type="button"
            onClick={save}
            className="flex h-11 min-w-0 items-center gap-2 rounded-full px-5 text-[13px] font-bold transition-transform active:scale-95"
            style={{ background: accent, color: readableOn(accent) }}
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="truncate">{saved ? "Opening contacts…" : "Save contact"}</span>
          </button>

          {showQr && (
            <button
              type="button"
              onClick={() => {
                if (!url) setResolved(window.location.href.split("?")[0]);
                setOpen(true);
                const username = (card as { username?: string }).username;
                if (username) trackCardEvent(username, "qr_open");
              }}
              aria-label="Show QR code"
              title="QR code"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{
                background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                color: dark ? "#fff" : "#111",
              }}
            >
              <QrCode className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>

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
