import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * After dark. Left-aligned and asymmetric on purpose — Minimal is the quiet,
 * centred default, and this exists for the card that wants to look like it
 * belongs to a different kind of night than a business card does.
 *
 * The glow lives in exactly one place, the rule under the name, rather than
 * smeared across every line of text — a card that glows everywhere reads as
 * noise, not energy.
 */
export default function NeonCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#050505");
  const { accent, accentText: ink } = theme;
  const role = roleLine(card);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* A single low grid, fading out before halfway up the screen — texture,
          not a floor. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] opacity-[0.14]"
        style={{
          backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
          backgroundSize: "38px 38px",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <main className="relative mx-auto w-full max-w-sm px-6 pt-16 pb-28">
        <div className="card-rise flex items-start gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="card-avatar flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
            style={{ borderColor: `${accent}88` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[15px] font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: theme.fgMuted }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
              />
              online now
            </span>
          </div>
        </div>

        <h1
          className="card-name card-rise mt-6 text-[40px] font-black uppercase leading-[0.92] tracking-tight"
          style={{ ["--d" as string]: "60ms" }}
        >{card.full_name}</h1>

        {/* The one glowing line. Everything else is flat colour. */}
        <div
          className="card-rise mt-3 h-[3px] w-14 rounded-full"
          style={{ background: accent, boxShadow: `0 0 14px ${accent}`, ["--d" as string]: "100ms" }}
        />

        {role && (
          <p
            className="card-headline card-rise mt-4 text-[14px] font-semibold"
            style={{ color: ink, ["--d" as string]: "140ms" }}
          >{role}</p>
        )}

        {card.location && (
          <p
            className="card-location card-rise mt-2 flex items-center gap-1.5 text-[11px]"
            style={{ color: theme.fgMuted, ["--d" as string]: "170ms" }}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {card.location}
          </p>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mt-5 text-[14px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "200ms" }}
          >{card.bio}</p>
        )}

        {/* Chips wrap rather than stack full-width — a different rhythm to
            Minimal's list, and the right shape for a shorter, punchier label
            set (handles, socials, a set time). */}
        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient"} />
        ) : (
          <nav className="mt-8 flex flex-wrap gap-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[12px] font-bold uppercase tracking-wide transition-all hover:[border-color:var(--glow)] hover:[box-shadow:0_0_16px_var(--glow-soft)]"
                style={
                  {
                    borderColor: theme.border,
                    color: theme.fg,
                    "--glow": accent,
                    "--glow-soft": `${accent}55`,
                    ["--d" as string]: `${240 + index * 45}ms`,
                  } as React.CSSProperties
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: ink }} />
                {button.label}
                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            );
          })}
        </nav>
        )}

      </main>
    </div>
  );
}
