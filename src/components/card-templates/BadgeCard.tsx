import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * PROFILE — an office ID badge, not a landing page.
 *
 * Built for the desk job: a department colour band, a squared photo instead
 * of a circular one, and links laid out as a printed detail sheet rather than
 * a stack of chunky buttons. Nothing here glows or drifts — the whole point
 * is to look like something HR would actually print.
 */
export default function BadgeCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#F7F8FA");
  const { accent, accentText: ink, onAccent } = theme;
  const role = roleLine(card);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />

      {/* The one gesture this template makes: a flat colour band standing in
          for the lanyard-clip colour real office badges use to sort people
          by department at a glance. */}
      <div className="card-rise h-3 w-full" style={{ background: accent, ["--d" as string]: "0ms" }} />

      <main className="mx-auto w-full max-w-sm px-6 pb-24 pt-12">
        <div
          className="card-rise sticker flex flex-col items-center rounded-3xl border px-6 pb-8 pt-10 text-center"
          style={{ borderColor: theme.border, background: theme.surface, ["--d" as string]: "60ms" }}
        >
          <div
            className="card-avatar flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2"
            style={{ borderColor: accent, background: `${accent}14` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[22px] font-black" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <h1 className="card-name mt-5 text-[22px] font-black leading-tight tracking-tight">
            {card.full_name}
          </h1>

          {role && (
            <p
              className="card-headline mt-1.5 text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ color: ink }}
            >
              {role}
            </p>
          )}

          {card.location && (
            <p
              className="card-location mt-3 flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: theme.fgMuted }}
            >
              <MapPin className="h-3 w-3 shrink-0" />
              {card.location}
            </p>
          )}

          {card.bio && (
            <p
              className="card-bio mt-4 text-[13px] leading-relaxed"
              style={{ color: theme.fgDim }}
            >
              {card.bio}
            </p>
          )}

          {/* A single printed-looking rule, like the perforation under a
              badge photo before the detail fields start. */}
          <div className="mt-6 flex w-full items-center gap-3">
            <span className="h-px flex-1" style={{ background: theme.border }} />
            <span
              className="text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: theme.fgMuted }}
            >
              contact
            </span>
            <span className="h-px flex-1" style={{ background: theme.border }} />
          </div>
        </div>

        {/* Detail rows — a form, not a button rack. Each row reads left to
            right like a line on a printed sheet: icon, field, arrow. */}
        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient"} />
        ) : (
        <nav
          className="card-rise sticker mt-4 divide-y overflow-hidden rounded-2xl border"
          style={{ borderColor: theme.border, ["--d" as string]: "130ms" }}
        >
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="group flex min-h-14 items-center gap-3 px-4 transition-colors"
                // divide-y's injected border-top picks up whatever border-color
                // this element itself carries — border-color doesn't inherit in
                // CSS, so setting it only on the <nav> above leaves every row's
                // divider defaulting to currentColor instead of the theme.
                style={{ borderColor: theme.border }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: accent, color: onAccent }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{button.label}</span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  style={{ color: theme.fgMuted }}
                />
              </a>
            );
          })}
        </nav>
        )}

        <p
          className="card-rise mt-8 text-center text-[10px] font-bold uppercase tracking-[0.24em]"
          style={{ color: theme.border, ["--d" as string]: `${200 + buttons.length * 40}ms` }}
        >
          @{card.username}
        </p>
      </main>
    </div>
  );
}
