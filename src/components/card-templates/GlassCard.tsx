import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, mixHex, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * Dark, frosted, lit by drifting orbs — all derived from the owner's own
 * accent color, never a fixed hue of ours, so the ambient glow still reads
 * as their brand rather than a fixed platform color.
 */
export default function GlassCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own dark-glass
  // assumption. On the native surface every value below matches what the
  // literal #05070C/white pair used to produce exactly.
  const theme = resolveCardTheme(card, "#05070C");
  const { accent, accentText: ink } = theme;
  const orbTint = mixHex(accent, "#ffffff", 0.35);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* Optional photo backdrop, heavily dimmed so the frosted panels and
          text stay readable over whatever gets uploaded. */}
      {card.cover_url && (
        <div className="pointer-events-none fixed inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.cover_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: `${theme.surface}CC` }} />
        </div>
      )}

      {/* Three orbs on different phases — the background never sits still. */}
      <div
        className="float-orb pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full blur-[130px] opacity-30"
        style={{ background: accent }}
      />
      <div
        className="float-orb pointer-events-none absolute bottom-10 -left-24 h-[320px] w-[320px] rounded-full blur-[120px] opacity-20"
        style={{ background: accent, ["--d" as string]: "3s" }}
      />
      <div
        className="float-orb pointer-events-none absolute top-1/3 -right-24 h-[280px] w-[280px] rounded-full blur-[120px] opacity-[0.16]"
        style={{ background: orbTint, ["--d" as string]: "6s" }}
      />

      <main className="relative mx-auto w-full max-w-sm px-5 pt-20 pb-32">
        <div
          className="card-rise card-shine relative overflow-hidden rounded-3xl bg-white/[0.05] p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          style={{ borderWidth: 1, borderStyle: "solid", borderColor: theme.border, ["--d" as string]: "0ms" }}
        >
          <div className="relative mx-auto w-fit">
            <span
              className="pulse-ring absolute inset-0 rounded-2xl border"
              style={{ borderColor: accent }}
            />
            <div
              className="card-avatar relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border"
              style={{
                borderColor: `${accent}55`,
                background: `linear-gradient(140deg, ${accent}26, transparent)`,
              }}
            >
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.avatar_url}
                  alt={card.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[24px] font-black" style={{ color: theme.fg }}>
                  {initialsOf(card.full_name)}
                </span>
              )}
            </div>
          </div>

          <h1 className="card-name mt-6 text-[30px] font-black tracking-tight">{card.full_name}</h1>

          {card.headline && (
            <p
              className="card-headline mt-1.5 text-[13px] font-semibold"
              style={{ color: ink, textShadow: `0 0 22px ${accent}66` }}
            >{card.headline}</p>
          )}

          {card.company && <p className="card-company mt-1 text-[13px]" style={{ color: theme.fgDim }}>{card.company}</p>}

          {card.location && (
            <p className="mt-3 flex items-start justify-center gap-1.5 text-[11px]" style={{ color: theme.fgMuted }}>
              <MapPin className="mt-px h-3.5 w-3.5 shrink-0" />
              <span className="card-location text-left">{card.location}</span>
            </p>
          )}

          {card.bio && <p className="card-bio mt-5 text-[13px] leading-relaxed" style={{ color: theme.fgDim }}>{card.bio}</p>}
        </div>

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
        ) : (
          <nav className="mt-4 space-y-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-white/[0.04] px-5 py-4 text-[15px] font-semibold backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.99]"
                style={{ borderWidth: 1, borderStyle: "solid", borderColor: theme.border, ["--d" as string]: `${120 + index * 60}ms` }}
              >
                {/* Accent bleeds in from the left edge on hover. */}
                <span
                  className="absolute inset-y-0 left-0 w-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: accent, boxShadow: `0 0 18px ${accent}` }}
                />
                <Icon
                  className="relative h-[18px] w-[18px] transition-transform group-hover:scale-110"
                  style={{ color: ink }}
                />
                <span className="relative flex-1">{button.label}</span>
                <ArrowUpRight
                  className="relative h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:[color:var(--fg)]"
                  style={{ color: theme.fgMuted, ["--fg" as string]: theme.fg }}
                />
              </a>
            );
          })}
        </nav>
        )}

      </main>
    </div>
  );
}
