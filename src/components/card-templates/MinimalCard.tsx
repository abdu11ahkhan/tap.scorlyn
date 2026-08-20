import { ArrowUpRight, Download, MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * The quiet default. A restrained business card, not a landing page —
 * centred, on paper, with one precise touch of the owner's colour rather
 * than a wash of it. No glow, no drifting shapes: the earlier version's
 * blurred orbs and pulsing ring read as the generic gradient-blob template
 * this one exists to be the opposite of. Everything that moves here moves
 * once, on load, and settles.
 */
export default function MinimalCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#ffffff");
  const { accent, accentText: ink } = theme;
  const role = roleLine(card);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <main className="mx-auto flex w-full max-w-sm flex-col items-center px-6 pt-20 pb-28 text-center">
        <div
          className="card-avatar card-rise flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border"
          style={{ borderColor: theme.border, ["--d" as string]: "0ms" }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.avatar_url}
              alt={card.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[20px] font-medium tracking-wide" style={{ color: ink }}>
              {initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1
          className="card-name card-rise mt-7 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em]"
          style={{ ["--d" as string]: "60ms" }}
        >{card.full_name}</h1>

        {role && (
          <p
            className="card-headline card-rise mt-2 text-[13px] font-medium"
            style={{ color: theme.fgDim, ["--d" as string]: "110ms" }}
          >{role}</p>
        )}

        {card.location && (
          <p
            className="card-location card-rise mt-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em]"
            style={{ color: theme.fgMuted, ["--d" as string]: "150ms" }}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {card.location}
          </p>
        )}

        {/* A single precise line of colour — the one place the accent
            appears before someone taps something. */}
        <div
          className="card-rise mt-5 h-px w-8"
          style={{ background: accent, ["--d" as string]: "190ms" }}
        />

        {card.bio && (
          <p
            className="card-bio card-rise mt-5 text-[14px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "220ms" }}
          >{card.bio}</p>
        )}

        <nav className="mt-9 w-full space-y-2">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-[13px] font-medium transition-colors"
                style={{
                  borderColor: theme.border,
                  ["--d" as string]: `${260 + index * 45}ms`,
                }}
              >
                <Icon
                  className="h-4 w-4 shrink-0 transition-colors"
                  style={{ color: theme.fgMuted }}
                />
                <span className="min-w-0 flex-1 truncate">{button.label}</span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  style={{ color: theme.fgMuted }}
                />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors"
          style={{
            borderColor: theme.border,
            color: theme.fgDim,
            ["--d" as string]: `${300 + buttons.length * 45}ms`,
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Save to contacts
        </SaveContact>

        <p
          className="card-rise mt-8 text-[10px] uppercase tracking-[0.2em]"
          style={{ color: theme.border, ["--d" as string]: `${340 + buttons.length * 45}ms` }}
        >
          @{card.username}
        </p>
      </main>
    </div>
  );
}
