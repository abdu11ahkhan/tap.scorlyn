import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  initialsOf,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * SECTIONED — a small studio site on one page.
 *
 * Jump links across the top, then work, then contact. The anchors are what
 * make this a "site" rather than a card: someone can be sent straight to the
 * work, or straight to how to reach you.
 */
export default function StudioCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own paper-white
  // assumption. On the native surface every value below matches what the
  // literal white/#111 pair used to produce exactly.
  const theme = resolveCardTheme(card, "#FFFFFF");
  const { accent, accentText: ink, onAccent } = theme;
  const gallery = resolveGallery(card.gallery);

  const sections = [
    { id: "work", label: "work", show: gallery.length > 0 },
    { id: "contact", label: "contact", show: buttons.length > 0 },
  ].filter((s) => s.show);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <header
        id="top"
        className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ backgroundColor: `${theme.surface}E6`, borderColor: theme.border }}
      >
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 py-3">
          <div
            className="card-avatar flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}1F` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
          <span className="card-name min-w-0 flex-1 truncate text-[13px] font-bold">{card.full_name}</span>
          <nav className="flex gap-1 text-[11px] font-semibold" style={{ color: theme.fgDim }}>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex min-h-11 items-center px-2 hover:[color:var(--fg)]"
                style={{ ["--fg" as string]: theme.fg }}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-24">
        <section className="card-rise scroll-mt-16 pt-12">
          <h1 className="card-headline text-[2.5rem] font-bold leading-[1.05] tracking-tight">{card.headline || card.full_name}</h1>
          {card.company && (
            <p className="card-company mt-2 text-[13px] font-bold uppercase tracking-[0.2em]" style={{ color: ink }}>{card.company}</p>
          )}
          {card.bio && (
            <p className="card-bio mt-5 text-[15px] leading-relaxed" style={{ color: theme.fgDim }}>{card.bio}</p>
          )}
          {card.location && (
            <p className="card-location mt-3 text-[13px] font-semibold" style={{ color: theme.fgMuted }}>{card.location}</p>
          )}
        </section>

        {gallery.length > 0 && (
          <section id="work" className="scroll-mt-16 pt-14">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
              work
            </h2>
            <div className="mt-4 space-y-4">
              {gallery.map((item, index) => (
                <figure
                  key={index}
                  className="card-rise overflow-hidden rounded-xl bg-neutral-100"
                  style={{ ["--d" as string]: `${index * 60}ms` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption || `${card.full_name}'s work`} className="w-full" />
                  {item.caption && (
                    <figcaption className="px-4 py-3 text-[13px] font-semibold" style={{ color: theme.fgDim }}>
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {buttons.length > 0 && (
          <section id="contact" className="scroll-mt-16 pt-14">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
              contact
            </h2>
            <nav className="mt-4 space-y-2.5">
              {buttons.map((button, index) => {
                const Icon = iconFor(button.kind);
                return (
                  <a
                    key={`${button.kind}-${index}`}
                    href={button.href}
                    target={button.external ? "_blank" : undefined}
                    rel={button.external ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3.5 text-[15px] font-semibold transition-colors hover:[border-color:var(--fg)]"
                    style={{ borderColor: theme.border, ["--fg" as string]: theme.fg }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${accent}1A`, color: ink }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">{button.label}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: theme.fgMuted }} />
                  </a>
                );
              })}
            </nav>

            <SaveContact
              card={card}
              className="mt-5 flex h-12 items-center justify-center rounded-xl text-[13px] font-bold"
              style={{ background: accent, color: onAccent }}
            >
              Save to contacts
            </SaveContact>
          </section>
        )}
      </main>
    </div>
  );
}
