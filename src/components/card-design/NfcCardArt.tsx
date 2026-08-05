"use client";

import { QRCodeSVG } from "qrcode.react";
import { initialsOf, readableOn, type CardProfile } from "@/lib/card";
import { iconFor } from "@/components/card-templates/button-icons";

/**
 * Artwork for the physical NFC card, derived from the digital one.
 *
 * Real card geometry: ISO/IEC 7810 ID-1 is 85.6 × 54 mm, so the aspect ratio is
 * fixed at 1.586. Everything is sized in % of that box, which means the same
 * component works as a thumbnail and as a print-scale preview.
 */
export const CARD_ASPECT = 85.6 / 54;

export type CardFinish = "minimal" | "bold" | "gradient" | "midnight" | "sticker";

export const CARD_FINISHES: { id: CardFinish; name: string; blurb: string }[] = [
  { id: "minimal", name: "Minimal", blurb: "White, thin type, quiet." },
  { id: "bold", name: "Bold", blurb: "Accent-filled, name front and centre." },
  { id: "gradient", name: "Gradient", blurb: "Accent fading to black." },
  { id: "midnight", name: "Midnight", blurb: "Matte black, accent detail." },
  { id: "sticker", name: "Sticker", blurb: "Chunky border, hard shadow." },
];

type Face = "front" | "back";

function surfaceFor(finish: CardFinish, accent: string) {
  switch (finish) {
    case "bold":
      return { bg: accent, fg: readableOn(accent), sub: 0.7, border: "transparent" };
    case "gradient":
      return {
        bg: `linear-gradient(135deg, ${accent} 0%, ${accent}AA 45%, #0A0A0A 100%)`,
        fg: "#FFFFFF",
        sub: 0.72,
        border: "transparent",
      };
    case "midnight":
      return { bg: "#0A0A0A", fg: "#FFFFFF", sub: 0.6, border: `${accent}55` };
    case "sticker":
      return { bg: "#FFFDF5", fg: "#0A0A0A", sub: 0.6, border: "#0A0A0A" };
    default:
      return { bg: "#FFFFFF", fg: "#111111", sub: 0.55, border: "#E5E5E5" };
  }
}

export default function NfcCardArt({
  card,
  finish = "minimal",
  face = "front",
  profileUrl,
  showQr = true,
  width = 420,
}: {
  card: CardProfile;
  finish?: CardFinish;
  face?: Face;
  profileUrl: string;
  showQr?: boolean;
  width?: number;
}) {
  const accent = card.accent_color || "#111111";
  const s = surfaceFor(finish, accent);
  const height = width / CARD_ASPECT;

  // Printed on the card, so it must match wherever this is actually hosted —
  // hardcoding a domain would put the wrong address on a physical product.
  const printedUrl = profileUrl.replace(/^https?:\/\//, "");

  // Everything scales off the card width so one component covers thumbnail
  // and full-size preview without a second set of styles.
  const u = width / 100;

  const isSticker = finish === "sticker";
  const qrFg = finish === "minimal" || isSticker ? "#0A0A0A" : s.fg;
  const qrBg =
    finish === "minimal" || isSticker ? "transparent" : "rgba(255,255,255,0.92)";

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width,
        height,
        borderRadius: u * 4.2,
        background: s.bg,
        color: s.fg,
        border: s.border === "transparent" ? "none" : `${Math.max(1, u * 0.5)}px solid ${s.border}`,
        boxShadow: isSticker
          ? `${u * 1.4}px ${u * 1.4}px 0 0 ${accent}`
          : "0 18px 40px rgba(0,0,0,0.28)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Texture, per finish */}
      {finish === "midnight" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(circle at 85% 15%, ${accent}30 0%, transparent 45%)`,
          }}
        />
      )}
      {isSticker && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: "radial-gradient(#0a0a0a 1px, transparent 1px)",
            backgroundSize: `${u * 3}px ${u * 3}px`,
          }}
        />
      )}

      {face === "front" ? (
        <div
          className="relative flex h-full flex-col justify-between"
          style={{ padding: u * 7 }}
        >
          {/* Top row: avatar + NFC mark */}
          <div className="flex items-start justify-between">
            <div className="flex items-center" style={{ gap: u * 2.5 }}>
              <div
                className="flex items-center justify-center overflow-hidden"
                style={{
                  width: u * 11,
                  height: u * 11,
                  borderRadius: u * 3,
                  background: finish === "bold" ? `${s.fg}22` : `${accent}1F`,
                  border: isSticker ? `${u * 0.5}px solid #0A0A0A` : "none",
                }}
              >
                {card.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    style={{
                      fontSize: u * 4.4,
                      fontWeight: 900,
                      color: finish === "bold" ? s.fg : accent,
                    }}
                  >
                    {initialsOf(card.full_name)}
                  </span>
                )}
              </div>
            </div>

            {/* The NFC wave — signals the card is tappable. Three nested arcs
                that all bulge right; sweeping them from the same x with a
                growing radius (the obvious approach) draws a crescent. */}
            <svg
              width={u * 7}
              height={u * 7}
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.8 }}
            >
              {[
                { x: 8, r: 4, y: 8, h: 8 },
                { x: 12, r: 7, y: 5, h: 14 },
                { x: 16, r: 10, y: 2, h: 20 },
              ].map((a) => (
                <path
                  key={a.r}
                  d={`M${a.x} ${a.y} A ${a.r} ${a.r} 0 0 1 ${a.x} ${a.y + a.h}`}
                  stroke={finish === "bold" ? s.fg : accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>

          {/* Identity */}
          <div>
            <p
              style={{
                fontSize: u * 7.2,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {card.full_name}
            </p>
            {card.headline && (
              <p
                style={{
                  marginTop: u * 1.6,
                  fontSize: u * 3.2,
                  fontWeight: 700,
                  opacity: s.sub,
                  letterSpacing: "0.02em",
                }}
              >
                {card.headline}
              </p>
            )}
          </div>

          {/* Foot: handle + QR */}
          <div className="flex items-end justify-between" style={{ gap: u * 3 }}>
            <div className="min-w-0">
              {card.company && (
                <p
                  style={{
                    fontSize: u * 2.7,
                    fontWeight: 700,
                    opacity: s.sub * 0.9,
                  }}
                >
                  {card.company}
                </p>
              )}
              <p
                style={{
                  marginTop: u * 0.8,
                  fontSize: u * 2.7,
                  fontWeight: 800,
                  opacity: s.sub,
                  letterSpacing: "0.06em",
                }}
              >
                {printedUrl}
              </p>
            </div>

            {showQr && (
              <div
                className="shrink-0"
                style={{
                  padding: u * 1.2,
                  borderRadius: u * 1.6,
                  background: qrBg,
                  lineHeight: 0,
                }}
              >
                <QRCodeSVG
                  value={profileUrl}
                  size={u * 16}
                  bgColor="transparent"
                  fgColor={qrFg}
                  level="M"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ---------------- Back ---------------- */
        <div
          className="relative flex h-full flex-col items-center justify-center text-center"
          style={{ padding: u * 7, gap: u * 2.5 }}
        >
          {showQr ? (
            <>
              <div
                style={{
                  padding: u * 2,
                  borderRadius: u * 2,
                  background: qrBg,
                  lineHeight: 0,
                }}
              >
                <QRCodeSVG
                  value={profileUrl}
                  size={u * 26}
                  bgColor="transparent"
                  fgColor={qrFg}
                  level="M"
                />
              </div>
              <p style={{ fontSize: u * 2.8, fontWeight: 800, opacity: s.sub }}>
                Tap the card, or scan
              </p>
            </>
          ) : (
            <p style={{ fontSize: u * 5, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Tap to connect
            </p>
          )}

          {/* Contact icons available on the card */}
          <div className="flex items-center" style={{ gap: u * 2.4 }}>
            {card.buttons.slice(0, 5).map((b, i) => {
              const Icon = iconFor(b.kind);
              return (
                <Icon
                  key={i}
                  className="shrink-0"
                  style={{
                    width: u * 3.4,
                    height: u * 3.4,
                    opacity: s.sub,
                    color: finish === "bold" ? s.fg : accent,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
