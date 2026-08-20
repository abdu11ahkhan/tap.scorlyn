import { ArrowRight } from "lucide-react";
import {
  fontStack,
  resolveCardTheme,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * LANDING — one thing, one button.
 *
 * The first link becomes an oversized primary action and the rest are demoted
 * to small text underneath. For a launch, a booking page, a single product:
 * anything where a list of equal-weight buttons would blunt the point.
 */
export default function LaunchCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#08080A");
  const { accent, accentText: ink, onAccent } = theme;
  const [primary, ...secondary] = buttons;

  return (
    <div
      className="grain relative flex min-h-screen flex-col justify-center overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <div
        className="float-orb pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-[130px]"
        style={{ background: accent }}
      />

      <main className="relative mx-auto w-full max-w-md px-6 py-20 text-center">
        {card.company && (
          <p
            className="card-company card-rise text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: theme.fgMuted }}
          >{card.company}</p>
        )}

        <h1
          className="card-name card-rise mt-4 text-[clamp(2.6rem,11vw,4rem)] font-bold leading-[0.95] tracking-tight"
          style={{ ["--d" as string]: "60ms" }}
        >{card.full_name}</h1>

        {card.headline && (
          <p
            className="card-headline card-rise mt-3 text-[18px] font-semibold"
            style={{ color: ink, ["--d" as string]: "110ms" }}
          >{card.headline}</p>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mx-auto mt-5 max-w-[22rem] text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "160ms" }}
          >{card.bio}</p>
        )}

        {primary && (
          <a
            href={primary.href}
            target={primary.external ? "_blank" : undefined}
            rel={primary.external ? "noopener noreferrer" : undefined}
            className="card-rise mt-9 inline-flex h-16 w-full items-center justify-center gap-2 rounded-full text-[18px] font-bold"
            style={{
              background: accent,
              color: onAccent,
              ["--d" as string]: "220ms",
            }}
          >
            {primary.label}
            <ArrowRight className="h-5 w-5" />
          </a>
        )}

        {secondary.length > 0 && (
          <div className="card-rise mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {secondary.map((button, index) => (
              <a
                key={`${button.kind}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="flex min-h-11 items-center text-[13px] font-semibold underline-offset-4 transition-colors hover:[color:var(--fg)] hover:underline"
                style={{ color: theme.fgDim, ["--fg" as string]: theme.fg }}
              >
                {button.label}
              </a>
            ))}
          </div>
        )}

        <SaveContact
          card={card}
          className="mt-10 flex min-h-11 items-center text-[13px] font-semibold underline-offset-4 transition-colors hover:[color:var(--fg)] hover:underline"
          style={{ color: theme.fgMuted, ["--fg" as string]: theme.fg }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
