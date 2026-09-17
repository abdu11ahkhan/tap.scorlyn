import { MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * Alternating tilts so the stack looks hand-placed rather than laid out.
 * Kept under ~2° — steeper angles make neighbouring strips overlap, and the
 * tape tab on each one needs clear space above it.
 */
const TILTS = ["-1.6deg", "1.2deg", "-0.9deg", "1.8deg", "-1.3deg", "0.8deg"];

/**
 * Scrapbook: polaroid avatar, washi tape, everything slightly crooked.
 * The playful one.
 *
 * The polaroid frame and the bio/link cards keep their literal `bg-white`
 * paper and literal dark ink — that white paper is the fixed prop, not the
 * page surface, so it stays put regardless of what the owner picks for
 * `surface_color` (same call StickerCard's white cards make). Only the page
 * background itself, and text sitting directly on it, are themed below.
 */
export default function TapeCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own warm-paper
  // assumption. On the native surface every value below matches what the
  // literal #F4F1EA/#1A1A1A pair used to produce exactly.
  const theme = resolveCardTheme(card, "#F4F1EA");
  const { accent, accentText: ink } = theme;

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* Torn-paper texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #0000 0 12px, #00000005 12px 24px)",
        }}
      />

      <main className="relative mx-auto w-full max-w-sm px-6 pt-16 pb-28">
        {/* Polaroid */}
        <div
          className="card-rise relative mx-auto w-fit -rotate-2 bg-white p-3 pb-10 shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
          style={{ ["--d" as string]: "0ms" }}
        >
          {/* Washi tape */}
          <span
            className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-4deg] opacity-70"
            style={{ background: accent }}
          />
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden bg-[#E8E4DA]">
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[36px] font-black text-[#1A1A1A]/25">
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
          <p className="absolute bottom-2.5 left-0 right-0 text-center text-[13px] font-bold italic" style={{ color: "#1A1A1A" }}>
            {card.full_name.split(" ")[0]}
          </p>
        </div>

        <div
          className="card-rise mt-8 text-center"
          style={{ ["--d" as string]: "90ms" }}
        >
          <h1 className="card-name text-[30px] font-black leading-tight tracking-tight">{card.full_name}</h1>
          {card.headline && (
            <span
              className="card-headline mt-2 inline-block -rotate-1 px-2 py-0.5 text-[13px] font-bold"
              style={{ background: `${accent}66` }}
            >{card.headline}</span>
          )}
          {card.company && (
            <p className="card-company mt-2 text-[13px]" style={{ color: theme.fgDim }}>{card.company}</p>
          )}
          {card.location && (
            <p className="card-location mt-2 flex items-center justify-center gap-1.5 text-[11px]" style={{ color: theme.fgMuted }}>
              <MapPin className="h-3.5 w-3.5" />
              {card.location}
            </p>
          )}
        </div>

        {card.bio && (
          <p
            className="card-bio card-rise mx-auto mt-6 max-w-[19rem] rotate-[0.6deg] bg-white p-5 text-center text-[15px] leading-relaxed text-[#1A1A1A]/75 shadow-[0_6px_18px_rgba(0,0,0,0.1)]"
            style={{ ["--d" as string]: "150ms" }}
          >{card.bio}</p>
        )}

        {/* Generous gap: the tape tab sits above each strip, so tight spacing
            makes it land on the strip before it. */}
        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
        ) : (
          <nav className="mt-10 space-y-6">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group relative flex w-full items-center gap-3 bg-white px-5 py-4 text-[15px] font-bold shadow-[0_5px_16px_rgba(0,0,0,0.1)] transition-all duration-300 hover:rotate-0 hover:shadow-[0_10px_26px_rgba(0,0,0,0.16)]"
                style={{
                  color: "#1A1A1A",
                  rotate: TILTS[index % TILTS.length],
                  ["--d" as string]: `${200 + index * 60}ms`,
                }}
              >
                {/* Tape holding each strip down */}
                <span
                  className="absolute -top-2 left-6 h-4 w-12 -rotate-3 opacity-60"
                  style={{ background: accent }}
                />
                <Icon className="h-[18px] w-[18px]" style={{ color: ink }} />
                <span className="flex-1 text-left">{button.label}</span>
                <span className="opacity-30 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            );
          })}
        </nav>
        )}

      </main>
    </div>
  );
}
