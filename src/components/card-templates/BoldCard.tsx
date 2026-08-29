import { ArrowUpRight, MapPin } from "lucide-react";
import {
  fontStack,
  initialsOf,
  readableOn,
  resolveCardTheme,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
/**
 * Oversized display name, hard left alignment, gradient-filled buttons that
 * catch a shine on touch. The name is the design; the colour does the rest.
 */
export default function BoldCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#FAFAF8");
  const accent = card.accent_color || "#111111";
  // Buttons are filled with the accent, so the label colour has to follow it.
  const onAccent = readableOn(accent);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <main className="relative mx-auto w-full max-w-md px-6 pt-20 pb-32">
        <div className="card-rise flex items-center gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="card-avatar flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg"
            style={{
              background: `linear-gradient(140deg, ${accent}, ${accent}99)`,
              color: onAccent,
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
              <span className="text-[18px] font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>
          {card.location && (
            <p className="card-location flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.fgMuted }}>
              <MapPin className="h-3.5 w-3.5" />
              {card.location}
            </p>
          )}
        </div>

        <h1
          className="card-name card-rise mt-8 text-[60px] font-black leading-[0.9] tracking-[-0.04em]"
          style={{ ["--d" as string]: "90ms" }}
        >{card.full_name}</h1>

        {card.headline && (
          <p
            className="card-headline card-rise mt-4 inline-block bg-clip-text text-[18px] font-bold leading-snug text-transparent"
            style={{
              backgroundImage: `linear-gradient(100deg, ${accent}, ${accent}AA)`,
              ["--d" as string]: "160ms",
            }}
          >{card.headline}</p>
        )}

        {card.company && (
          <p
            className="card-company card-rise mt-1 text-[13px] font-semibold"
            style={{ color: theme.fgMuted, ["--d" as string]: "200ms" }}
          >{card.company}</p>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "240ms" }}
          >{card.bio}</p>
        )}

        <nav className="mt-10 space-y-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise card-shine group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-5 py-4 text-[15px] font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
                style={{
                  background: `linear-gradient(100deg, ${accent}, ${accent}D0)`,
                  color: onAccent,
                  ["--d" as string]: `${300 + index * 60}ms`,
                }}
              >
                <Icon className="relative h-[18px] w-[18px] opacity-80" />
                <span className="relative flex-1 text-left">{button.label}</span>
                <ArrowUpRight className="relative h-4 w-4 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </a>
            );
          })}
        </nav>

      </main>
    </div>
  );
}
