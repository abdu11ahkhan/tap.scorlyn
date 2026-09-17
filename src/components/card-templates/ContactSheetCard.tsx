import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  initialsOf,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * PORTFOLIO — a photographer's contact sheet.
 *
 * Small, dense, numbered, on paper. Where the lookbook shows one piece
 * properly, this shows volume: the point is that there is a lot of it.
 */
export default function ContactSheetCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#F2F1EC");
  const accent = card.accent_color || "#111111";
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-12">
        <header className="card-rise border-b pb-4" style={{ borderColor: theme.fg }}>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="card-name text-[24px] font-bold uppercase tracking-tight">{card.full_name}</h1>
              {card.headline && (
                <p className="card-headline mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: theme.fgMuted }}>{card.headline}</p>
              )}
            </div>
            <div
              className="card-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border"
              style={{ background: `${accent}1F`, borderColor: theme.fg }}
            >
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[13px] font-bold">{initialsOf(card.full_name)}</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.fgMuted }}>
            {card.company && <span className="card-company">{card.company}</span>}
            {card.location && <span className="card-location">{card.location}</span>}
            {gallery.length > 0 && <span>{gallery.length} frames</span>}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-bio card-rise mt-5 text-[13px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "60ms" }}
          >{card.bio}</p>
        )}

        {gallery.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-1.5">
            {gallery.map((item, index) => (
              <figure
                key={index}
                className="card-rise"
                style={{ ["--d" as string]: `${100 + index * 35}ms` }}
              >
                <div className="overflow-hidden border bg-white" style={{ borderColor: theme.fg }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || `${card.full_name}'s work`}
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <figcaption className="mt-1 truncate text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.fgMuted }}>
                  {String(index + 1).padStart(2, "0")}
                  {item.caption ? ` ${item.caption}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
        ) : (
          <nav className="mt-8 space-y-2">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex min-h-11 items-center justify-between border-b py-3 text-[13px] font-bold uppercase tracking-wide transition-colors hover:[border-color:var(--fg)]"
              style={{ borderColor: theme.border, ["--fg" as string]: theme.fg }}
            >
              {button.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ))}
        </nav>
        )}

      </main>
    </div>
  );
}
