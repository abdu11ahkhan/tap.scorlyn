import { MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * PROFILE — the healthcare card. Clean, calm, and built around one question
 * a patient actually has: are they taking new people right now.
 *
 * available_for_work/availability_note power the status pill instead of
 * sitting unused below the fold — "accepting new patients" is the one line
 * that changes someone's mind about tapping the first button, so it goes
 * at the top, not buried in the shared extras section every other template
 * leaves it to.
 */
export default function ClinicCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#F5FAF9");
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
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
        style={{ background: `linear-gradient(to bottom, ${accent}22, transparent)` }}
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-col items-center px-6 pt-20 pb-28 text-center">
        <div
          className="card-avatar card-rise flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4"
          style={{ borderColor: theme.surface, background: `${accent}18`, boxShadow: `0 0 0 1px ${theme.border}`, ["--d" as string]: "0ms" }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[22px] font-bold" style={{ color: ink }}>
              {initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1 className="card-name card-rise mt-6 text-[26px] font-bold tracking-tight" style={{ ["--d" as string]: "60ms" }}>
          {card.full_name}
        </h1>

        {role && (
          <p className="card-headline card-rise mt-1.5 text-[14px] font-semibold" style={{ color: ink, ["--d" as string]: "100ms" }}>
            {role}
          </p>
        )}

        {card.location && (
          <p className="card-location card-rise mt-2 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: theme.fgMuted, ["--d" as string]: "140ms" }}>
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {card.location}
          </p>
        )}

        {/* The one status a patient actually wants before anything else. */}
        {card.available_for_work && (
          <span
            className="card-rise mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold"
            style={{ background: accent, color: onAccent, ["--d" as string]: "180ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: onAccent }} />
            {card.availability_note?.trim() || "Accepting new patients"}
          </span>
        )}

        {card.bio && (
          <p className="card-bio card-rise mt-5 text-[14px] leading-relaxed" style={{ color: theme.fgDim, ["--d" as string]: "220ms" }}>
            {card.bio}
          </p>
        )}

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient"} />
        ) : (
          <nav className="mt-8 w-full space-y-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            const primary = index === 0;
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[14px] font-bold transition-transform active:scale-[0.98]"
                style={
                  primary
                    ? { background: accent, color: onAccent, ["--d" as string]: `${260 + index * 45}ms` }
                    : { border: `1px solid ${theme.border}`, color: theme.fg, ["--d" as string]: `${260 + index * 45}ms` }
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {button.label}
              </a>
            );
          })}
        </nav>
        )}
      </main>
    </div>
  );
}
