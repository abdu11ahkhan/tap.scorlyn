import { MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
/**
 * PROFILE — the studio card. Dark, soft-edged, unhurried. Generous space
 * around everything, the opposite instinct to Coach's blocky urgency —
 * calm reads as spacing here, not as a smaller font.
 *
 * The ring around the avatar reuses .pulse-ring, the same slow soft
 * expand-and-fade Aurora uses — a genuine "breathing" cue here rather than
 * a loading spinner, since it's the only thing moving on an otherwise still
 * page.
 */
export default function WellnessCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#0E1410");
  const { accent, accentText: ink, onAccent } = theme;
  const role = roleLine(card);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-25 blur-[110px]"
        style={{ background: accent }}
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-col items-center px-7 pt-24 pb-28 text-center">
        <div className="card-rise relative" style={{ ["--d" as string]: "0ms" }}>
          <span
            className="pulse-ring absolute inset-0 rounded-full border"
            style={{ borderColor: `${accent}88` }}
          />
          <div
            className="card-avatar relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border"
            style={{ borderColor: `${accent}44`, background: `${accent}14` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[20px] font-normal" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
        </div>

        <h1
          className="card-name card-rise mt-8 text-[27px] font-normal leading-tight tracking-tight"
          style={{ ["--d" as string]: "70ms" }}
        >
          {card.full_name}
        </h1>

        {role && (
          <p
            className="card-headline card-rise mt-2 text-[12px] uppercase tracking-[0.24em]"
            style={{ color: ink, ["--d" as string]: "120ms" }}
          >
            {role}
          </p>
        )}

        {card.location && (
          <p
            className="card-location card-rise mt-3 flex items-center gap-1.5 text-[11px]"
            style={{ color: theme.fgMuted, ["--d" as string]: "160ms" }}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {card.location}
          </p>
        )}

        {card.available_for_work && (
          <span
            className="card-rise mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-medium"
            style={{ borderColor: `${accent}55`, color: theme.fgDim, ["--d" as string]: "200ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            {card.availability_note?.trim() || "Now booking sessions"}
          </span>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 text-[14px] font-light leading-[1.8]"
            style={{ color: theme.fgDim, ["--d" as string]: "240ms" }}
          >
            {card.bio}
          </p>
        )}

        <nav className="mt-10 w-full space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            const primary = index === 0;
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise flex min-h-13 w-full items-center justify-center gap-2.5 rounded-full text-[13px] font-medium transition-transform active:scale-[0.98]"
                style={
                  primary
                    ? { background: accent, color: onAccent, ["--d" as string]: `${300 + index * 55}ms` }
                    : { border: `1px solid ${theme.border}`, color: theme.fgDim, ["--d" as string]: `${300 + index * 55}ms` }
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {button.label}
              </a>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
