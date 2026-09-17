import { ArrowUpRight } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, resolveGallery, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * PROFILE — the creator card. A big bio, a big link stack, a gradient behind
 * all of it.
 *
 * The classic link-in-bio shape (handle first, one thumb-width pill per
 * link) rather than Aurora's glass panels — pills read as "tap me" faster
 * at the size a phone screenshot gets shared at, which is the whole point
 * of a page built to be screenshotted. The gallery strip at the bottom is
 * the one thing genuinely built for this persona: recent posts, not a
 * portfolio grid, so it only shows up if there's something to show.
 */
export default function FlareCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#150A1E");
  const accent = card.accent_color || "#D04CF0";
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <div
        className="gradient-pan pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: `radial-gradient(at 20% 0%, ${accent}CC 0px, transparent 55%), radial-gradient(at 90% 30%, #FF3D9A99 0px, transparent 50%), radial-gradient(at 30% 100%, ${accent}77 0px, transparent 55%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[#0A0612]/40" />

      <main className="relative mx-auto w-full max-w-sm px-6 pt-20 pb-24">
        <div className="card-rise flex flex-col items-center text-center" style={{ ["--d" as string]: "0ms" }}>
          {/* The ring is a gradient square behind a smaller, inset avatar —
              an Instagram-story ring, without needing a conic-gradient
              border (patchy support at this radius on older WebViews). */}
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full p-[3px]"
            style={{ background: `linear-gradient(135deg, ${accent}, #FF3D9A)` }}
          >
            <div className="card-avatar flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-black/40 bg-black/30 backdrop-blur-xl">
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.avatar_url}
                  alt={card.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[24px] font-black">{initialsOf(card.full_name)}</span>
              )}
            </div>
          </div>

          <h1 className="card-name mt-5 text-[26px] font-black leading-tight tracking-tight">
            {card.full_name}
          </h1>

          <p
            className="mt-1 text-[13px] font-bold"
            style={{ color: accent }}
          >
            @{card.username}
          </p>

          {card.headline && (
            <p className="card-headline mt-3 text-[13px] font-semibold" style={{ color: theme.fgDim }}>
              {card.headline}
            </p>
          )}

          {card.bio && (
            <p className="card-bio mt-2 text-[13px] leading-relaxed" style={{ color: theme.fgMuted }}>
              {card.bio}
            </p>
          )}
        </div>

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
        ) : (
          <nav className="mt-8 space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise card-shine group relative flex min-h-[52px] w-full items-center gap-3 overflow-hidden rounded-full border border-white/25 bg-white/10 px-5 text-[15px] font-bold backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                style={{ ["--d" as string]: `${140 + index * 55}ms` }}
              >
                <Icon className="relative h-[18px] w-[18px] shrink-0" />
                <span className="relative min-w-0 flex-1 truncate text-center">{button.label}</span>
                <ArrowUpRight className="relative h-4 w-4 shrink-0 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </a>
            );
          })}
        </nav>
        )}

        {gallery.length > 0 && (
          <div className="card-rise mt-9" style={{ ["--d" as string]: `${180 + buttons.length * 55}ms` }}>
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: theme.fgMuted }}>
              recent
            </p>
            <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1">
              {gallery.map((item, index) => (
                <div
                  key={index}
                  className="relative aspect-square w-20 shrink-0 snap-center overflow-hidden rounded-xl border border-white/15"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || `${card.full_name}'s post`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
