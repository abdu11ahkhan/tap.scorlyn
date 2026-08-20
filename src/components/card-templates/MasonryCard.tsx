import { ArrowUpRight, MapPin } from "lucide-react";
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
 * PORTFOLIO — the work leads, the person follows.
 *
 * Filmstrip's sibling: same CSS-columns mechanism kept (images keep their
 * own proportions rather than being cropped to a grid), but the hierarchy is
 * reversed. Filmstrip opens with a title card and swipes through one piece
 * at a time — a sequence. This opens straight into a dense wall of
 * everything at once — a folio — and the identity strip that would
 * normally be the hero here is compact on purpose, more masthead than card.
 */
export default function MasonryCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#ffffff");
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
      <main className="mx-auto w-full max-w-lg pb-24 pt-10">
        {/* Masthead — a line, not a hero. The gallery is what this card is
            for; the identity strip only has to say who it belongs to. */}
        <header className="card-rise flex items-center gap-3 px-5">
          <div
            className="card-avatar flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}1F` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[13px] font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="card-name truncate text-[16px] font-bold tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="card-headline truncate text-[12px] font-semibold" style={{ color: ink }}>{role}</p>
            )}
          </div>

          {card.location && (
            <p
              className="card-location hidden shrink-0 items-center gap-1 text-[11px] font-medium sm:flex"
              style={{ color: theme.fgMuted }}
            >
              <MapPin className="h-3 w-3" />
              {card.location}
            </p>
          )}
        </header>

        {gallery.length > 0 && (
          <div className="mt-6 px-5">
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: theme.fgMuted }}
            >
              selected work · {gallery.length}
            </p>
            <div className="columns-2 gap-3 [column-fill:_balance]">
              {gallery.map((item, index) => (
                <figure
                  key={index}
                  className="card-rise mb-3 break-inside-avoid overflow-hidden rounded-xl"
                  style={{ background: theme.border, ["--d" as string]: `${60 + index * 45}ms` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption || `${card.full_name}'s work`} className="w-full" />
                  {item.caption && (
                    <figcaption
                      className="px-2.5 py-2 text-[11px] font-semibold"
                      style={{ color: theme.fgMuted }}
                    >
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mt-7 px-5 text-[14px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "80ms" }}
          >{card.bio}</p>
        )}

        <nav className="mt-6 space-y-2 px-5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="card-rise flex min-h-11 items-center justify-between rounded-xl border px-4 text-[14px] font-semibold transition-colors"
              style={{ borderColor: theme.border, ["--d" as string]: `${120 + index * 45}ms` }}
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: theme.fgMuted }} />
            </a>
          ))}
        </nav>

        <div className="mt-5 px-5">
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
