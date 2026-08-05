"use client";

import { QRCodeSVG } from "qrcode.react";
import { Mail, MapPin, Phone } from "lucide-react";
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

export type CardFinish =
  | "minimal"
  | "bold"
  | "gradient"
  | "midnight"
  | "sticker"
  | "split"
  | "frame"
  | "mono"
  | "luxe";

export const CARD_FINISHES: { id: CardFinish; name: string; blurb: string }[] = [
  { id: "minimal", name: "Minimal", blurb: "White, thin type, quiet." },
  { id: "bold", name: "Bold", blurb: "Accent-filled, name front and centre." },
  { id: "gradient", name: "Gradient", blurb: "Accent fading to black." },
  { id: "midnight", name: "Midnight", blurb: "Matte black, accent detail." },
  { id: "sticker", name: "Sticker", blurb: "Chunky border, hard shadow." },
  { id: "split", name: "Split", blurb: "Accent band down the left edge." },
  { id: "frame", name: "Frame", blurb: "Thick accent border, airy inside." },
  { id: "mono", name: "Mono", blurb: "Monospace, technical, understated." },
  { id: "luxe", name: "Luxe", blurb: "Deep charcoal with a hairline rule." },
];

type Face = "front" | "back";

function surfaceFor(finish: CardFinish, accent: string) {
  switch (finish) {
    case "bold":
      return { bg: accent, fg: readableOn(accent), sub: 0.72, border: "transparent" };
    case "gradient":
      return {
        bg: `linear-gradient(135deg, ${accent} 0%, ${accent}AA 45%, #0A0A0A 100%)`,
        fg: "#FFFFFF",
        sub: 0.74,
        border: "transparent",
      };
    case "midnight":
      return { bg: "#0A0A0A", fg: "#FFFFFF", sub: 0.62, border: `${accent}55` };
    case "sticker":
      return { bg: "#FFFDF5", fg: "#0A0A0A", sub: 0.62, border: "#0A0A0A" };
    case "split":
      return { bg: "#FFFFFF", fg: "#111111", sub: 0.58, border: "#E8E8E8" };
    case "frame":
      return { bg: "#FFFFFF", fg: "#111111", sub: 0.58, border: accent };
    case "mono":
      return { bg: "#111311", fg: "#E8EDE8", sub: 0.55, border: "#2A2E2A" };
    case "luxe":
      return { bg: "#16161A", fg: "#F5F3EE", sub: 0.6, border: `${accent}44` };
    default:
      return { bg: "#FFFFFF", fg: "#111111", sub: 0.56, border: "#E5E5E5" };
  }
}

/**
 * Contact lines for the card face.
 *
 * Pulled from the buttons the profile already has, so a card can never print a
 * number the digital profile doesn't carry. Only the details that belong in
 * print — a card is no place for a Spotify link.
 */
function contactLines(card: CardProfile) {
  const find = (kind: string) =>
    card.buttons.find((b) => b.kind === kind && b.value?.trim())?.value.trim();

  const phone = find("phone") ?? find("whatsapp") ?? card.phone ?? undefined;
  const email = find("email") ?? card.email ?? undefined;

  return [
    phone ? { Icon: Phone, text: phone } : null,
    email ? { Icon: Mail, text: email } : null,
    card.location ? { Icon: MapPin, text: card.location } : null,
  ].filter(Boolean) as { Icon: typeof Phone; text: string }[];
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

  // Everything scales off the card width so one component covers thumbnail
  // and full-size preview without a second set of styles.
  const u = width / 100;

  const isSticker = finish === "sticker";
  const isFrame = finish === "frame";
  const isSplit = finish === "split";
  const isMono = finish === "mono";
  const light = ["minimal", "sticker", "split", "frame"].includes(finish);

  const qrFg = light ? "#0A0A0A" : s.fg;
  const qrBg = light ? "transparent" : "rgba(255,255,255,0.92)";
  const contacts = contactLines(card);

  const mono = isMono ? "var(--font-geist-mono), ui-monospace, monospace" : undefined;

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width,
        height,
        borderRadius: u * 4.2,
        background: s.bg,
        color: s.fg,
        border:
          s.border === "transparent"
            ? "none"
            : `${isFrame ? u * 2.2 : Math.max(1, u * 0.5)}px solid ${s.border}`,
        boxShadow: isSticker
          ? `${u * 1.4}px ${u * 1.4}px 0 0 ${accent}`
          : "0 18px 40px rgba(0,0,0,0.28)",
        fontFamily: mono ?? "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Per-finish texture / structure */}
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
      {isSplit && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ width: u * 7, background: accent }}
        />
      )}
      {isMono && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`,
            backgroundSize: `${u * 5}px ${u * 5}px`,
          }}
        />
      )}
      {finish === "luxe" && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: u * 8,
            right: u * 8,
            top: "50%",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            opacity: 0.5,
          }}
        />
      )}

      {face === "front" ? (
        <div
          className="relative flex h-full flex-col justify-between"
          style={{
            padding: u * 7,
            paddingLeft: isSplit ? u * 12 : u * 7,
          }}
        >
          {/* Top: avatar + NFC mark */}
          <div className="flex items-start justify-between">
            <div
              className="flex items-center justify-center overflow-hidden"
              style={{
                width: u * 10,
                height: u * 10,
                borderRadius: isMono ? u * 1.2 : u * 3,
                background: finish === "bold" ? `${s.fg}22` : `${accent}1F`,
                border: isSticker ? `${u * 0.5}px solid #0A0A0A` : "none",
              }}
            >
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span
                  style={{
                    fontSize: u * 4,
                    fontWeight: 900,
                    color: finish === "bold" ? s.fg : accent,
                  }}
                >
                  {initialsOf(card.full_name)}
                </span>
              )}
            </div>

            {/* The NFC wave — signals the card is tappable. Three nested arcs
                that all bulge right; sweeping them from the same x with a
                growing radius (the obvious approach) draws a crescent. */}
            <svg
              width={u * 6.5}
              height={u * 6.5}
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
          <div style={{ marginTop: u * 1 }}>
            <p
              style={{
                fontSize: u * 6.6,
                fontWeight: isMono ? 700 : 900,
                letterSpacing: isMono ? "-0.01em" : "-0.03em",
                lineHeight: 1,
              }}
            >
              {card.full_name}
            </p>
            {card.headline && (
              <p
                style={{
                  marginTop: u * 1.4,
                  fontSize: u * 3,
                  fontWeight: 700,
                  opacity: s.sub,
                  letterSpacing: "0.02em",
                }}
              >
                {card.headline}
                {card.company ? ` · ${card.company}` : ""}
              </p>
            )}
          </div>

          {/* Contact block — this is what makes it a business card. */}
          <div className="flex items-end justify-between" style={{ gap: u * 3 }}>
            <div className="min-w-0" style={{ display: "grid", rowGap: u * 1.2 }}>
              {contacts.map(({ Icon, text }, i) => (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ gap: u * 1.6, minWidth: 0 }}
                >
                  <Icon
                    style={{
                      width: u * 2.7,
                      height: u * 2.7,
                      flexShrink: 0,
                      color: finish === "bold" ? s.fg : accent,
                      opacity: finish === "bold" ? 0.8 : 1,
                    }}
                  />
                  <span
                    style={{
                      fontSize: u * 2.7,
                      fontWeight: 600,
                      opacity: s.sub + 0.15,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {showQr && (
              <div
                className="shrink-0"
                style={{
                  padding: u * 1.1,
                  borderRadius: u * 1.6,
                  background: qrBg,
                  lineHeight: 0,
                }}
              >
                <QRCodeSVG
                  value={profileUrl}
                  size={u * 15}
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

          {/* Which channels this card opens */}
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
