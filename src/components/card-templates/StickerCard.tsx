import { ArrowUpRight, MapPin } from "lucide-react";
import {
  fontStack,
  initialsOf,
  resolveCardTheme,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * Neo-brutalist: 2px black outlines, hard offset shadows, no gradients.
 * The house style, turned into a card.
 *
 * The white sticker cards, chips and buttons scattered on the page keep
 * their literal `bg-white`/`border-ink`/`text-ink` — that's the fixed white
 * "paper" the brutalist look is built from, not the page surface, so it
 * stays put regardless of what the owner picks for `surface_color` (the same
 * call AgencyCard makes for a caption on its own permanent black scrim).
 * Only the page background itself, and anything sitting directly on it, are
 * themed below.
 */
export default function StickerCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own warm-paper
  // assumption. On the native surface every value below matches what the
  // literal #FFFDF5/#0a0a0a pair used to produce exactly.
  const theme = resolveCardTheme(card, "#FFFDF5");
  const { accent, onAccent } = theme;

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* Dot grid paper */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(#0a0a0a 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      <main className="relative mx-auto w-full max-w-sm px-5 pt-16 pb-28">
        <div
          className="card-rise sticker-lg rounded-[1.75rem] border-2 border-ink p-6"
          style={{ background: accent, color: onAccent, ["--d" as string]: "0ms" }}
        >
          <div className="flex items-center gap-4">
            <div className="card-avatar flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-ink bg-white">
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.avatar_url}
                  alt={card.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[24px] font-black text-ink">
                  {initialsOf(card.full_name)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="card-name text-[30px] font-black leading-[0.9] tracking-tighter">{card.full_name}</h1>
              {card.headline && (
                <p className="card-headline mt-1.5 text-[13px] font-black uppercase tracking-tight opacity-80">{card.headline}</p>
              )}
            </div>
          </div>

          {(card.company || card.location) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {card.company && (
                <span className="card-company rounded-full border-2 border-ink bg-white px-3 py-1 text-[11px] font-black text-ink">{card.company}</span>
              )}
              {card.location && (
                <span className="flex items-start gap-1 rounded-2xl border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-black text-ink">
                  <MapPin className="mt-px h-3 w-3 shrink-0" />
                  <span className="card-location">{card.location}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {card.bio && (
          <p
            className="card-bio card-rise sticker mt-4 rounded-2xl border-2 border-ink bg-white p-5 text-[15px] font-semibold leading-relaxed"
            style={{ color: "#0a0a0a", ["--d" as string]: "90ms" }}
          >{card.bio}</p>
        )}

        <nav className="mt-4 space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise sticker sticker-press group flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white px-5 py-4 text-[15px] font-black text-ink"
                style={{ ["--d" as string]: `${150 + index * 60}ms` }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink"
                  style={{ background: accent, color: onAccent }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left">{button.label}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-6 flex min-h-12 items-center justify-center rounded-full border-2 text-center text-[12px] font-black uppercase tracking-widest"
          style={{ borderColor: theme.fgMuted, color: theme.fg, ["--d" as string]: `${190 + buttons.length * 60}ms` }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
