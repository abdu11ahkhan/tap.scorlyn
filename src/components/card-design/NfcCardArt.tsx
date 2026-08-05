"use client";

import { QRCodeSVG } from "qrcode.react";
import { Mail, MapPin, Phone } from "lucide-react";
import { initialsOf, readableOn, type CardProfile } from "@/lib/card";
import { iconFor } from "@/components/card-templates/button-icons";

/**
 * Artwork for the physical NFC card, derived from the digital one.
 *
 * Real card geometry: ISO/IEC 7810 ID-1 is 85.6 × 54 mm, so the aspect ratio
 * is fixed at 1.586. Everything is expressed in `u` (1% of card width), which
 * means one component serves both the thumbnail and a print-scale preview and
 * the proportions hold at any size.
 *
 * Each finish is a different *composition*, not a recolour of one layout —
 * otherwise nine options are really one option in nine colours.
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
  { id: "minimal", name: "Minimal", blurb: "Name low-left, generous white space." },
  { id: "bold", name: "Bold", blurb: "Oversized name filling the card." },
  { id: "gradient", name: "Gradient", blurb: "Centred, avatar over a colour wash." },
  { id: "midnight", name: "Midnight", blurb: "Two columns split by a hairline." },
  { id: "sticker", name: "Sticker", blurb: "Boxed blocks, hard shadow." },
  { id: "split", name: "Split", blurb: "Accent panel holding the portrait." },
  { id: "frame", name: "Frame", blurb: "Ruled border, centred classic." },
  { id: "mono", name: "Mono", blurb: "Monospace label rows." },
  { id: "luxe", name: "Luxe", blurb: "Centred serif between hairlines." },
];

type Face = "front" | "back";

/** Which pieces of the profile actually get printed. */
export type CardFields = {
  avatar: boolean;
  headline: boolean;
  company: boolean;
  phone: boolean;
  email: boolean;
  location: boolean;
  qr: boolean;
  nfc: boolean;
};

export const DEFAULT_CARD_FIELDS: CardFields = {
  avatar: true,
  headline: true,
  company: true,
  phone: true,
  email: true,
  location: true,
  qr: true,
  nfc: true,
};

export const CARD_FIELD_OPTIONS: { id: keyof CardFields; label: string }[] = [
  { id: "avatar", label: "photo" },
  { id: "headline", label: "role" },
  { id: "company", label: "company" },
  { id: "phone", label: "phone" },
  { id: "email", label: "email" },
  { id: "location", label: "location" },
  { id: "qr", label: "qr code" },
  { id: "nfc", label: "nfc mark" },
];

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
      return { bg: "#0A0A0A", fg: "#FFFFFF", sub: 0.62, border: `${accent}44` };
    case "sticker":
      return { bg: "#FFFDF5", fg: "#0A0A0A", sub: 0.62, border: "#0A0A0A" };
    case "split":
      return { bg: "#FFFFFF", fg: "#111111", sub: 0.58, border: "#E8E8E8" };
    case "frame":
      return { bg: "#FFFFFF", fg: "#111111", sub: 0.58, border: accent };
    case "mono":
      return { bg: "#111311", fg: "#E8EDE8", sub: 0.55, border: "#2A2E2A" };
    case "luxe":
      return { bg: "#16161A", fg: "#F5F3EE", sub: 0.6, border: `${accent}33` };
    default:
      return { bg: "#FFFFFF", fg: "#111111", sub: 0.56, border: "#E5E5E5" };
  }
}

/**
 * Contact lines for the card face.
 *
 * Pulled from the buttons the profile already has, so a card can never print a
 * number the digital profile doesn't carry.
 */
function contactLines(card: CardProfile, fields: CardFields) {
  const find = (kind: string) =>
    card.buttons.find((b) => b.kind === kind && b.value?.trim())?.value.trim();

  const phone = find("phone") ?? find("whatsapp") ?? card.phone ?? undefined;
  const email = find("email") ?? card.email ?? undefined;

  return [
    fields.phone && phone ? { Icon: Phone, text: phone } : null,
    fields.email && email ? { Icon: Mail, text: email } : null,
    fields.location && card.location ? { Icon: MapPin, text: card.location } : null,
  ].filter(Boolean) as { Icon: typeof Phone; text: string }[];
}

export default function NfcCardArt({
  card,
  finish = "minimal",
  face = "front",
  profileUrl,
  fields = DEFAULT_CARD_FIELDS,
  width = 420,
}: {
  card: CardProfile;
  finish?: CardFinish;
  face?: Face;
  profileUrl: string;
  /** Which pieces of the profile to print. */
  fields?: CardFields;
  width?: number;
}) {
  const accent = card.accent_color || "#111111";
  const s = surfaceFor(finish, accent);
  const height = width / CARD_ASPECT;
  const u = width / 100;

  const isSticker = finish === "sticker";
  const isFrame = finish === "frame";
  const isMono = finish === "mono";
  const light = ["minimal", "sticker", "split", "frame"].includes(finish);
  // On these the card surface IS the accent, so accent-coloured marks would be
  // invisible — they have to borrow the surface foreground instead.
  const surfaceIsAccent = finish === "bold" || finish === "gradient";
  const onAccentFg = surfaceIsAccent ? s.fg : accent;

  // The dark finishes sit the QR on a light plate so a phone camera can read it,
  // which means the modules are always dark — never the surface foreground.
  const qrFg = "#0A0A0A";
  const qrBg = light ? "transparent" : "rgba(255,255,255,0.94)";
  const contacts = contactLines(card, fields);

  // Resolved once here so the nine layouts don't each have to ask permission.
  const showQr = fields.qr;
  const headline = fields.headline ? card.headline : "";
  const company = fields.company ? card.company : "";

  const fontFamily = isMono
    ? "var(--font-geist-mono), ui-monospace, monospace"
    : finish === "luxe"
      ? "ui-serif, Georgia, serif"
      : "var(--font-inter), system-ui, sans-serif";

  // ---------------------------------------------------------------- pieces

  const Avatar = ({
    size,
    radius,
    fg = onAccentFg,
  }: {
    size: number;
    radius: number;
    /** Override where the piece sits on the accent itself, not the surface. */
    fg?: string;
  }) =>
    !fields.avatar ? null : (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: u * size,
        height: u * size,
        borderRadius: u * radius,
        background: surfaceIsAccent ? `${s.fg}22` : `${accent}1F`,
        border: isSticker ? `${u * 0.5}px solid #0A0A0A` : "none",
      }}
    >
      {card.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: u * size * 0.4, fontWeight: 800, color: fg }}>
          {initialsOf(card.full_name)}
        </span>
      )}
    </div>
  );

  /** Three nested arcs bulging right. Each needs its own origin — sweeping
   *  from one x with growing radii draws a crescent, not a signal. */
  const NfcMark = ({
    size = 6.5,
    opacity = 0.8,
    fg = onAccentFg,
  }: {
    size?: number;
    opacity?: number;
    fg?: string;
  }) =>
    !fields.nfc ? null : (
    <svg
      width={u * size}
      height={u * size}
      viewBox="0 0 24 24"
      fill="none"
      // Keeps its right-hand slot in the justify-between rows even when the
      // avatar opposite it has been switched off.
      style={{ opacity, marginLeft: "auto" }}
    >
      {[
        { x: 8, r: 4, y: 8, h: 8 },
        { x: 12, r: 7, y: 5, h: 14 },
        { x: 16, r: 10, y: 2, h: 20 },
      ].map((a) => (
        <path
          key={a.r}
          d={`M${a.x} ${a.y} A ${a.r} ${a.r} 0 0 1 ${a.x} ${a.y + a.h}`}
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );

  const Qr = ({ size, pad = 1.1 }: { size: number; pad?: number }) =>
    showQr ? (
      <div
        className="shrink-0"
        style={{
          // Padding only earns its space when there's a plate to see. On the
          // light finishes it's invisible, and just floats the QR off the margin.
          padding: light ? 0 : u * pad,
          borderRadius: u * 1.5,
          background: qrBg,
          lineHeight: 0,
          // Holds the right edge even when every contact line beside it is off.
          marginLeft: "auto",
        }}
      >
        <QRCodeSVG
          value={profileUrl}
          size={u * size}
          bgColor="transparent"
          fgColor={qrFg}
          level="M"
        />
      </div>
    ) : null;

  const Contacts = ({
    size = 2.7,
    gap = 1.2,
    align = "start",
    icons = true,
  }: {
    size?: number;
    gap?: number;
    align?: "start" | "center";
    icons?: boolean;
  }) => (
    <div
      style={{
        display: "grid",
        rowGap: u * gap,
        justifyItems: align,
        minWidth: 0,
      }}
    >
      {contacts.map(({ Icon, text }, i) => (
        <div key={i} className="flex items-center" style={{ gap: u * 1.5, minWidth: 0 }}>
          {icons && (
            <Icon
              style={{
                width: u * size,
                height: u * size,
                flexShrink: 0,
                color: onAccentFg,
                opacity: surfaceIsAccent ? 0.8 : 1,
              }}
            />
          )}
          <span
            style={{
              fontSize: u * size,
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
  );

  // ---------------------------------------------------------------- layouts

  function front() {
    switch (finish) {
      /* Oversized name owning the whole card; everything else gets out of
         its way onto one baseline. */
      case "bold":
        return (
          <div className="flex h-full flex-col" style={{ padding: u * 7 }}>
            <div className="flex items-start justify-between">
              <Avatar size={9} radius={2.6} />
              <NfcMark />
            </div>
            <div style={{ marginTop: "auto" }}>
              <p
                style={{
                  fontSize: u * 11,
                  fontWeight: 900,
                  lineHeight: 0.86,
                  letterSpacing: "-0.045em",
                }}
              >
                {card.full_name}
              </p>
              <div
                className="flex items-end justify-between"
                style={{ marginTop: u * 3, gap: u * 3 }}
              >
                <div style={{ minWidth: 0 }}>
                  {headline && (
                    <p
                      style={{
                        fontSize: u * 3,
                        fontWeight: 700,
                        opacity: s.sub,
                        marginBottom: u * 1.4,
                      }}
                    >
                      {headline}
                    </p>
                  )}
                  <Contacts size={2.6} gap={0.9} />
                </div>
                <Qr size={14} />
              </div>
            </div>
          </div>
        );

      /* Centred portrait over the wash. Symmetrical, nothing on the left. */
      case "gradient":
      case "frame": {
        const pad = u * (isFrame ? 6 : 7);
        return (
          <div
            className="relative flex h-full flex-col items-center justify-center text-center"
            // Bottom padding leaves room for the absolutely-placed footer, so the
            // portrait block stays centred on the card rather than on what's left.
            style={{ padding: pad, paddingBottom: pad + u * 15 }}
          >
            <Avatar size={13} radius={13} />
            <p
              style={{
                marginTop: u * 2.6,
                fontSize: u * 6,
                fontWeight: isFrame ? 700 : 800,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {card.full_name}
            </p>
            {headline && (
              <p
                style={{
                  marginTop: u * 1.2,
                  fontSize: u * 2.7,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  opacity: s.sub,
                }}
              >
                {headline}
              </p>
            )}
            <div
              className="absolute flex items-end justify-between"
              style={{ left: pad, right: pad, bottom: pad, gap: u * 3 }}
            >
              <Contacts size={2.5} gap={0.9} />
              <Qr size={13} />
            </div>
          </div>
        );
      }

      /* Two columns divided by a hairline: identity left, details right. */
      case "midnight":
        return (
          <div className="flex h-full" style={{ padding: u * 7, gap: u * 5 }}>
            <div className="flex flex-col justify-between" style={{ width: "46%", minWidth: 0 }}>
              <Avatar size={10} radius={2.8} />
              <div>
                <p
                  style={{
                    fontSize: u * 5.6,
                    fontWeight: 800,
                    lineHeight: 0.98,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {card.full_name}
                </p>
                {headline && (
                  <p
                    style={{
                      marginTop: u * 1.2,
                      fontSize: u * 2.6,
                      fontWeight: 600,
                      color: accent,
                    }}
                  >
                    {headline}
                  </p>
                )}
              </div>
            </div>

            <div style={{ width: 1, background: `${s.fg}1F`, flexShrink: 0 }} />

            <div className="flex flex-1 flex-col" style={{ minWidth: 0 }}>
              <div className="flex justify-end">
                <NfcMark size={6} />
              </div>
              {/* Stacked, not side by side — this column is only ~40% of the card,
                  too narrow to seat the code beside a full email address. */}
              <div
                className="flex flex-col items-end"
                style={{ marginTop: "auto", gap: u * 2.2, minWidth: 0 }}
              >
                <Contacts size={2.4} gap={1} />
                <Qr size={12} />
              </div>
            </div>
          </div>
        );

      /* Accent panel carrying the portrait, content to its right. */
      case "split":
        return (
          <div className="flex h-full">
            <div
              className="flex shrink-0 flex-col items-center justify-center"
              style={{ width: "34%", background: accent, padding: u * 3 }}
            >
              {fields.avatar && (
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    width: u * 15,
                    height: u * 15,
                    borderRadius: u * 15,
                    background: `${readableOn(accent)}26`,
                  }}
                >
                  {card.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span
                      style={{ fontSize: u * 5, fontWeight: 800, color: readableOn(accent) }}
                    >
                      {initialsOf(card.full_name)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div
              className="flex flex-1 flex-col justify-between"
              style={{ padding: u * 6, minWidth: 0 }}
            >
              <div className="flex items-start justify-between">
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: u * 5.8,
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {card.full_name}
                  </p>
                  {headline && (
                    <p
                      style={{
                        marginTop: u * 1.1,
                        fontSize: u * 2.7,
                        fontWeight: 600,
                        opacity: s.sub,
                      }}
                    >
                      {headline}
                    </p>
                  )}
                </div>
                <NfcMark size={5.5} />
              </div>
              <div className="flex items-end justify-between" style={{ gap: u * 3 }}>
                <Contacts size={2.5} gap={0.9} />
                <Qr size={12} />
              </div>
            </div>
          </div>
        );

      /* Boxed blocks — the layout is the outlines, not the colour. */
      case "sticker":
        return (
          <div className="flex h-full flex-col" style={{ padding: u * 5, gap: u * 2.2 }}>
            <div
              className="flex items-center"
              style={{
                gap: u * 3,
                padding: u * 2.6,
                borderRadius: u * 2.4,
                border: `${u * 0.55}px solid #0A0A0A`,
                background: accent,
                color: readableOn(accent),
                boxShadow: `${u * 0.9}px ${u * 0.9}px 0 0 #0A0A0A`,
              }}
            >
              <Avatar size={10} radius={2.2} fg={readableOn(accent)} />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{ fontSize: u * 5, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  {card.full_name}
                </p>
                {headline && (
                  <p style={{ marginTop: u * 0.9, fontSize: u * 2.5, fontWeight: 800 }}>
                    {headline}
                  </p>
                )}
              </div>
              <div style={{ marginLeft: "auto" }}>
                <NfcMark size={6} opacity={1} fg={readableOn(accent)} />
              </div>
            </div>

            <div className="flex flex-1 items-stretch" style={{ gap: u * 2.2, minHeight: 0 }}>
              <div
                className="flex flex-1 flex-col justify-center"
                style={{
                  padding: u * 2.6,
                  borderRadius: u * 2.4,
                  border: `${u * 0.55}px solid #0A0A0A`,
                  background: "#fff",
                  minWidth: 0,
                }}
              >
                <Contacts size={2.5} gap={1} />
              </div>
              {showQr && (
                <div
                  className="flex items-center justify-center"
                  style={{
                    padding: u * 1.6,
                    borderRadius: u * 2.4,
                    border: `${u * 0.55}px solid #0A0A0A`,
                    background: "#fff",
                  }}
                >
                  <QRCodeSVG
                    value={profileUrl}
                    size={u * 15}
                    bgColor="transparent"
                    fgColor="#0A0A0A"
                    level="M"
                  />
                </div>
              )}
            </div>
          </div>
        );

      /* Label rows. Reads like a spec sheet. */
      case "mono":
        return (
          <div className="flex h-full flex-col" style={{ padding: u * 6.5 }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center" style={{ gap: u * 2.4, minWidth: 0 }}>
                <Avatar size={8} radius={1} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: u * 4.6, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {card.full_name}
                  </p>
                  <p style={{ fontSize: u * 2.4, opacity: s.sub }}>@{card.username}</p>
                </div>
              </div>
              <NfcMark size={5.5} />
            </div>

            <div
              style={{
                marginTop: u * 3.5,
                paddingTop: u * 3,
                borderTop: `1px solid ${s.fg}1F`,
                display: "grid",
                rowGap: u * 1.3,
              }}
            >
              {[
                headline ? { k: "role", v: headline } : null,
                ...contacts.map((c, i) => ({
                  k: ["tel", "mail", "loc"][i] ?? "info",
                  v: c.text,
                })),
              ]
                .filter(Boolean)
                .slice(0, 4)
                .map((row, i) => {
                  const r = row as { k: string; v: string };
                  return (
                    <div key={i} className="flex" style={{ gap: u * 2.5, minWidth: 0 }}>
                      <span
                        style={{
                          width: u * 9,
                          flexShrink: 0,
                          fontSize: u * 2.3,
                          opacity: 0.42,
                        }}
                      >
                        {r.k}
                      </span>
                      <span
                        style={{
                          fontSize: u * 2.4,
                          color: i === 0 ? accent : undefined,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.v}
                      </span>
                    </div>
                  );
                })}
            </div>

            {showQr && (
              <div className="flex justify-end" style={{ marginTop: "auto" }}>
                <Qr size={12} />
              </div>
            )}
          </div>
        );

      /* Centred serif held between two hairlines. */
      case "luxe": {
        const pad = u * 7;
        return (
          <div
            className="relative flex h-full flex-col items-center justify-center text-center"
            style={{ padding: pad, paddingBottom: pad + u * 13 }}
          >
            <p
              style={{
                fontSize: u * 2.3,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                opacity: 0.5,
              }}
            >
              {company || headline || ""}
            </p>

            <div
              style={{
                width: "62%",
                height: 1,
                background: `${accent}88`,
                margin: `${u * 2.6}px 0`,
              }}
            />

            <p style={{ fontSize: u * 7, fontWeight: 500, letterSpacing: "0.01em", lineHeight: 1 }}>
              {card.full_name}
            </p>

            <div
              style={{
                width: "62%",
                height: 1,
                background: `${accent}88`,
                margin: `${u * 2.6}px 0`,
              }}
            />

            <Contacts size={2.4} gap={0.8} align="center" icons={false} />

            <div
              className="absolute flex items-end justify-between"
              style={{ left: pad, right: pad, bottom: pad }}
            >
              <NfcMark size={5.5} opacity={0.6} />
              <Qr size={11} />
            </div>
          </div>
        );
      }

      /* Minimal: deliberate emptiness up top, everything anchored low. */
      default:
        return (
          <div className="flex h-full flex-col" style={{ padding: u * 7.5 }}>
            <div className="flex items-start justify-between">
              <Avatar size={9} radius={9} />
              <NfcMark size={6} opacity={0.55} />
            </div>

            <div style={{ marginTop: "auto" }}>
              <p
                style={{
                  fontSize: u * 6.2,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {card.full_name}
              </p>
              {headline && (
                <p
                  style={{
                    marginTop: u * 1.1,
                    fontSize: u * 2.6,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    opacity: s.sub,
                  }}
                >
                  {headline}
                </p>
              )}

              <div
                className="flex items-end justify-between"
                style={{ marginTop: u * 3.2, gap: u * 3 }}
              >
                <Contacts size={2.5} gap={0.9} icons={false} />
                <Qr size={12} />
              </div>
            </div>
          </div>
        );
    }
  }

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
            : `${isFrame ? u * 2 : Math.max(1, u * 0.5)}px solid ${s.border}`,
        boxShadow: isSticker
          ? `${u * 1.4}px ${u * 1.4}px 0 0 ${accent}`
          : "0 18px 40px rgba(0,0,0,0.28)",
        fontFamily,
      }}
    >
      {finish === "midnight" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(circle at 88% 12%, ${accent}30 0%, transparent 42%)`,
          }}
        />
      )}
      {isSticker && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(#0a0a0a 1px, transparent 1px)",
            backgroundSize: `${u * 3}px ${u * 3}px`,
          }}
        />
      )}
      {isMono && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`,
            backgroundSize: `${u * 5}px ${u * 5}px`,
          }}
        />
      )}

      <div className="relative h-full">
        {face === "front" ? (
          front()
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center text-center"
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
                <p style={{ fontSize: u * 2.8, fontWeight: 700, opacity: s.sub }}>
                  Tap the card, or scan
                </p>
              </>
            ) : (
              <p style={{ fontSize: u * 5, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Tap to connect
              </p>
            )}

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
                      color: onAccentFg,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
