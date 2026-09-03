import { MapPin } from "lucide-react";
import { initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
/**
 * PROFILE — the executive card. Dark, serif, and quiet about it.
 *
 * Ignores the font setting on purpose, the same carve-out Editorial makes:
 * the serif *is* the template, and switching it out for the owner's chosen
 * sans would leave nothing left of the idea. Links are underlined text, not
 * filled buttons — restraint reads as seniority here in a way a row of
 * accent-coloured pills doesn't.
 */
export default function SummitCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#111511");
  const { accent, accentText: ink } = theme;
  const role = roleLine(card);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{
        background: theme.surface,
        color: theme.fg,
        fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
      }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />

      <main className="mx-auto flex w-full max-w-sm flex-col items-center px-7 pt-20 pb-28 text-center">
        <div
          className="card-avatar card-rise flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border"
          style={{ borderColor: `${accent}66`, ["--d" as string]: "0ms" }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.avatar_url}
              alt={card.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[20px] font-normal" style={{ color: ink }}>
              {initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1
          className="card-name card-rise mt-8 text-[2.4rem] font-normal leading-[1.05] tracking-tight"
          style={{ ["--d" as string]: "60ms" }}
        >
          {card.full_name}
        </h1>

        {role && (
          <p
            className="card-headline card-rise mt-3 text-[11px] uppercase tracking-[0.28em]"
            style={{ color: ink, ["--d" as string]: "110ms" }}
          >
            {role}
          </p>
        )}

        <div
          className="card-rise mt-6 h-px w-10"
          style={{ background: `${accent}88`, ["--d" as string]: "160ms" }}
        />

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 text-[17px] italic leading-[1.65]"
            style={{ color: theme.fgDim, ["--d" as string]: "200ms" }}
          >
            &ldquo;{card.bio}&rdquo;
          </p>
        )}

        {card.location && (
          <p
            className="card-location card-rise mt-6 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em]"
            style={{ color: theme.fgMuted, ["--d" as string]: "240ms" }}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {card.location}
          </p>
        )}

        <nav className="mt-10 flex flex-col items-center gap-4">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group flex min-h-11 items-center gap-2.5 border-b border-transparent text-[15px] tracking-wide transition-colors hover:[border-color:var(--hover-border)]"
                style={{
                  ["--hover-border" as string]: `${accent}88`,
                  ["--d" as string]: `${290 + index * 55}ms`,
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: ink }} />
                {button.label}
              </a>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
