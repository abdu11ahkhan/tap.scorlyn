import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  initialsOf,
  resolveCardTheme,
  resolveGallery,
  roleLine,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * PORTFOLIO — a title card, then one frame at a time.
 *
 * Masonry's sibling: same idea (photographic work, scroll-snap kept exactly
 * as it was — a grid asks someone to choose what to look at, this shows them
 * one piece properly and lets the thumb do the rest), opposite hierarchy.
 * Masonry opens straight into a dense wall of everything; this opens on the
 * person, full-height, before the sequence starts — a title card, not a
 * masthead. Every frame after it is numbered, like a contact strip.
 */
export default function FilmstripCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#0B0B0F");
  const { accent, accentText: ink } = theme;
  const role = roleLine(card);
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <main className="mx-auto w-full max-w-md pb-24">
      {/* Title card — its own full-height beat before the sequence, the way
          a film opens on a name before the first cut. */}
      <header className="card-rise flex min-h-[68vh] flex-col items-center justify-center px-6 text-center">
        <div
          className="card-avatar flex h-32 w-32 items-center justify-center overflow-hidden rounded-full"
          style={{ background: `${accent}33` }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[24px] font-bold" style={{ color: ink }}>
              {initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1 className="card-name mt-6 text-[28px] font-bold tracking-tight">{card.full_name}</h1>
        {role && (
          <p className="card-headline mt-1.5 text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: ink }}>
            {role}
          </p>
        )}

        {card.bio && (
          <p
            className="card-bio mt-5 max-w-[22rem] text-[14px] leading-relaxed"
            style={{ color: theme.fgDim }}
          >{card.bio}</p>
        )}

        {gallery.length > 0 && (
          <p
            className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em]"
            style={{ color: theme.fgMuted }}
          >
            <span className="h-px w-6" style={{ background: theme.border }} />
            {gallery.length} frame{gallery.length === 1 ? "" : "s"} · swipe
            <span className="h-px w-6" style={{ background: theme.border }} />
          </p>
        )}
      </header>

      {gallery.length > 0 && (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {gallery.map((item, index) => (
            <figure
              key={index}
              className="card-rise relative w-[78%] shrink-0 snap-center"
              style={{ ["--d" as string]: `${index * 60}ms` }}
            >
              <div className="overflow-hidden rounded-2xl" style={{ background: theme.border }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption || `${card.full_name}'s work`}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              {/* Frame number — a contact-strip detail, not a caption. */}
              <span
                className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums backdrop-blur-sm"
                style={{ background: `${theme.surface}CC`, color: theme.fgMuted }}
              >
                {String(index + 1).padStart(2, "0")}/{String(gallery.length).padStart(2, "0")}
              </span>
              {item.caption && (
                <figcaption className="mt-2 text-[11px] font-semibold" style={{ color: theme.fgMuted }}>
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <nav className="mt-9 space-y-2 px-5">
        {buttons.map((button, index) => (
          <a
            key={`${button.kind}-${index}`}
            href={button.href}
            target={button.external ? "_blank" : undefined}
            rel={button.external ? "noopener noreferrer" : undefined}
            className="card-rise flex min-h-11 items-center justify-between rounded-xl border px-4 text-[14px] font-semibold transition-colors"
            style={{ borderColor: theme.border, ["--d" as string]: `${120 + index * 50}ms` }}
          >
            {button.label}
            <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: theme.fgMuted }} />
          </a>
        ))}
      </nav>

      <div className="mt-6 px-5">
        <SaveContact
          card={card}
          className="flex h-12 items-center justify-center rounded-xl text-[13px] font-bold"
          style={{ background: accent, color: theme.onAccent }}
        >
          Save to contacts
        </SaveContact>
      </div>
      </main>
    </div>
  );
}
