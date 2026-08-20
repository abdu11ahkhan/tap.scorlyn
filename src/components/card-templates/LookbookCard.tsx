import { ArrowUpRight, MapPin } from "lucide-react";
import {
  roleLine,
  fontStack,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * PORTFOLIO — full-bleed, one piece per screen.
 *
 * No margins and no grid. For work that is meant to be looked at rather than
 * scanned: photography, interiors, food. The name sits over the first image,
 * so the work is the first thing on screen rather than a header.
 *
 * The hero is the first gallery photo, not the avatar — the page is meant to
 * continue straight into the rest of the set below it. That's the split from
 * ShowcaseCard: this one is a sequential gallery essay; Showcase has no
 * gallery at all, just one cover/portrait plus a fast link list. Same hero
 * markup shape, different job.
 */
export default function LookbookCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own near-black
  // assumption. On the native surface every value below matches what the
  // literal #0A0A0A/white pair used to produce exactly.
  const theme = resolveCardTheme(card, "#0A0A0A");
  const { accent, accentText: ink, onAccent } = theme;
  const role = roleLine(card);
  const gallery = resolveGallery(card.gallery);
  const [lead, ...rest] = gallery;

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* Lead image with the identity over it. Falls back to the avatar so a
          card with no gallery yet still has a cover rather than a gap. */}
      <header className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
        {lead?.url || card.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lead?.url ?? card.avatar_url ?? ""}
            // The lead slot is content, not decoration — it's either the first
            // gallery photo or the person's own portrait, and it's the first
            // thing on the card. Use its caption when there is one, otherwise
            // a plain, true description rather than an empty alt.
            alt={lead?.url ? lead.caption ?? `Work by ${card.full_name}` : card.full_name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: accent }} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* This sits on the lead photo's own permanent black scrim, not on
            the page surface, so it stays literal white regardless of the
            resolved theme — same as the scrim itself. */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <h1 className="card-name card-rise text-[clamp(2.2rem,10vw,3.4rem)] font-bold leading-[0.95] tracking-tight">{card.full_name}</h1>
          {role && (
            <p
              className="card-headline card-rise mt-2 text-[13px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ink, ["--d" as string]: "80ms" }}
            >{role}</p>
          )}
          {card.location && (
            <p className="card-location card-rise mt-2 flex items-center gap-1.5 text-[11px] font-medium text-white/45">
              <MapPin className="h-3 w-3" />
              {card.location}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-8">
        {card.bio && (
          <p className="card-bio text-[15px] leading-relaxed" style={{ color: theme.fgDim }}>{card.bio}</p>
        )}

        {rest.length > 0 && (
          <div className="mt-8 space-y-8">
            {rest.map((item, index) => (
              <figure key={index} className="card-rise" style={{ ["--d" as string]: `${index * 70}ms` }}>
                <div className="-mx-5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption ?? ""} className="w-full" />
                </div>
                {item.caption && (
                  <figcaption className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: theme.fgMuted }}>
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <nav className="mt-10 space-y-2.5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between border-b py-3.5 text-[15px] font-semibold transition-colors hover:border-white/50"
              style={{ borderColor: theme.border }}
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4" style={{ color: theme.fgMuted }} />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-8 flex h-12 items-center justify-center rounded-full text-[13px] font-bold"
          style={{ background: accent, color: onAccent }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
