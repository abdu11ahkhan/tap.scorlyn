import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * PORTFOLIO — big imagery energy.
 *
 * A full-bleed cover built from the avatar, then each link as a wide captioned
 * plate. For photographers and anyone whose work is visual.
 *
 * Deliberately has no gallery grid below the cover — it's one statement photo
 * (cover_url, or the avatar) plus fast link access, not a sequence of work.
 * That's the split from LookbookCard: Lookbook's hero is the first gallery
 * photo and the page continues into the rest of the set; this one's hero is
 * the person's own cover/portrait and the page moves straight to links. Two
 * different jobs — "here's me, here's how to reach me" vs. "here's the work,
 * one piece at a time" — that happen to share a hero markup shape.
 */
export default function ShowcaseCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#0C0A0B");
  const { accent, accentText: ink } = theme;

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* Cover */}
      <section className="relative h-[58vh] min-h-[380px] overflow-hidden">
        {/* Prefer a dedicated cover; fall back to the avatar. */}
        {card.cover_url || card.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.cover_url || card.avatar_url || ""}
            alt={card.full_name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="gradient-pan absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(at 25% 25%, ${accent} 0px, transparent 60%), radial-gradient(at 75% 75%, ${accent}88 0px, transparent 60%)`,
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white/25">
              {initialsOf(card.full_name)}
            </span>
          </div>
        )}

        {/* Legibility scrim under the caption */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `linear-gradient(to top, ${theme.surface} 0%, ${theme.surface}59 55%, transparent 100%)` }}
        />

        {/* Fixed white regardless of surface_color: this text sits on a
            photo/gradient hero with its own scrim, not on the page's plain
            background, so it needs guaranteed contrast rather than the
            resolved-surface foreground. */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 text-white">
          <h1
            className="card-name card-rise text-[2.6rem] font-black leading-[0.9] tracking-tighter"
            style={{ ["--d" as string]: "0ms" }}
          >{card.full_name}</h1>
          {card.headline && (
            <p
              className="card-headline card-rise mt-2 text-[13px] font-black uppercase tracking-[0.2em]"
              style={{ color: ink, ["--d" as string]: "70ms" }}
            >{card.headline}</p>
          )}
          <div
            className="card-location card-rise mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-white/45"
            style={{ ["--d" as string]: "110ms" }}
          >
            {card.company && <span className="card-company">{card.company}</span>}
            {card.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {card.location}
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-8">
        {card.bio && (
          <p
            className="card-bio card-rise text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "150ms" }}
          >{card.bio}</p>
        )}

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient"} />
        ) : (
        <div className="mt-9 space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-white/[0.04] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:[border-color:var(--border-hover)]"
                style={
                  {
                    borderColor: theme.border,
                    ["--border-hover" as string]: theme.fgMuted,
                    ["--d" as string]: `${190 + index * 60}ms`,
                  } as React.CSSProperties
                }
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${accent}26`, color: ink }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-black tracking-tight">
                    {button.label}
                  </span>
                  <span
                    className="mt-0.5 block text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: theme.fgMuted }}
                  >
                    {String(index + 1).padStart(2, "0")} · view
                  </span>
                </span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: theme.fgMuted }}
                />
              </a>
            );
          })}
        </div>
        )}

      </main>
    </div>
  );
}
