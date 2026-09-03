import { ArrowRight } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
/**
 * PROFILE — the trainer card. Black, blocky, and loud about one thing: are
 * they taking new clients right now. Same reasoning as Clinic's status pill,
 * turned up — a coach's whole pitch is momentum, so the badge here is a
 * shouted uppercase tag instead of a quiet dot-and-line.
 */
export default function CoachCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#0A0A0A");
  const { accent, accentText: ink, onAccent } = theme;
  const role = roleLine(card);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* One diagonal bar of colour — the whole "energy" of the template,
          rather than a gradient wash that would fight the block type. Clear
          of the top edge (a negative offset gets clipped invisible by this
          root's own overflow-hidden) and short enough to sit above the
          avatar rather than through it. */}
      <div
        className="pointer-events-none absolute -left-1/4 top-10 h-12 w-[150%] -rotate-6"
        style={{ background: accent }}
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-col items-center px-6 pt-28 pb-28 text-center">
        <div
          className="card-avatar card-rise flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2"
          style={{ borderColor: accent, ["--d" as string]: "0ms" }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[22px] font-black" style={{ color: ink }}>
              {initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1
          className="card-name card-rise mt-6 text-[32px] font-black uppercase italic leading-[0.95] tracking-tight"
          style={{ ["--d" as string]: "60ms" }}
        >
          {card.full_name}
        </h1>

        {role && (
          <p
            className="card-headline card-rise mt-2 text-[13px] font-black uppercase tracking-[0.16em]"
            style={{ color: ink, ["--d" as string]: "100ms" }}
          >
            {role}
          </p>
        )}

        {card.available_for_work && (
          <span
            className="card-rise mt-5 inline-flex items-center rounded-md px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]"
            style={{ background: accent, color: onAccent, ["--d" as string]: "140ms" }}
          >
            {card.availability_note?.trim() || "Taking new clients"}
          </span>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 text-[15px] font-medium leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "180ms" }}
          >
            {card.bio}
          </p>
        )}

        <nav className="mt-9 w-full space-y-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group flex min-h-13 w-full items-center gap-3 rounded-lg border-2 px-5 text-left text-[14px] font-black uppercase tracking-tight transition-colors"
                style={{ borderColor: theme.border, ["--d" as string]: `${240 + index * 45}ms` }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: accent }} />
                <span className="min-w-0 flex-1 truncate">{button.label}</span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ color: accent }}
                />
              </a>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
