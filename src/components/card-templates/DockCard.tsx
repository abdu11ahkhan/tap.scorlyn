import { MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * Icon-only, held in a dock pinned to the bottom of the screen.
 *
 * The whole point of a tap card is that the other person's thumb is already
 * at the bottom of the phone. This puts every link there and leaves the top
 * of the screen for the photo, which is what people actually look at first.
 */
export default function DockCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#000000");
  const { accent, accentText: ink, onAccent } = theme;
  const role = roleLine(card);

  return (
    <div
      className="grain relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* Full-bleed portrait, or the accent if there's no photo yet. */}
      <div className="relative flex-1 overflow-hidden">
        {card.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.avatar_url}
            alt={card.full_name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(160deg, ${accent}, #0B0B0F)` }}
          >
            <span className="text-7xl font-bold text-white/25">
              {initialsOf(card.full_name)}
            </span>
          </div>
        )}

        {/* Reading gradient — text over a photo is unreadable without one. */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent" />

        {/* Fixed white regardless of surface_color: this sits over the photo
            (or its gradient fallback), not the page's plain background. */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 text-white">
          <h1 className="card-name card-rise text-[36px] font-bold leading-tight tracking-tight">{card.full_name}</h1>
          {role && (
            <p
              className="card-headline card-rise mt-1.5 text-[13px] font-semibold"
              style={{ color: ink, ["--d" as string]: "80ms" }}
            >{role}</p>
          )}
          {card.location && (
            <p
              className="card-location card-rise mt-2 flex items-center gap-1.5 text-[11px] font-medium text-white/45"
              style={{ ["--d" as string]: "120ms" }}
            >
              <MapPin className="h-3 w-3" />
              {card.location}
            </p>
          )}
          {card.bio && (
            <p
              className="card-bio card-rise mt-3 max-w-sm text-[13px] leading-relaxed text-white/60"
              style={{ ["--d" as string]: "160ms" }}
            >{card.bio}</p>
          )}
        </div>
      </div>

      {/* The dock. Scrolls sideways rather than wrapping, so it stays one row
          however many links there are. */}
      <div
        className="shrink-0 border-t px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl"
        style={{ borderColor: theme.border, backgroundColor: `${theme.surface}CC` }}
      >
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
          <nav className="flex items-center gap-3 overflow-x-auto pb-1">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.kind}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                title={button.label}
                aria-label={button.label}
                className="card-rise flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 active:scale-95"
                style={{ borderColor: theme.border, ["--d" as string]: `${200 + index * 55}ms` }}
              >
                <Icon className="h-5 w-5" style={{ color: theme.fgDim }} />
              </a>
            );
          })}

          </nav>
          {/* Hints that more icons sit off the right edge — the scroller has
              no other affordance to signal that. */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8"
            style={{ backgroundImage: `linear-gradient(to right, transparent, ${theme.surface})` }}
          />
          </div>

          {/* Outside the scroller. Inside it, the primary action slid off the
              right edge as soon as there were more than four links. */}
          <SaveContact
            card={card}
            className="card-rise flex h-14 shrink-0 items-center justify-center rounded-2xl px-5 text-[13px] font-bold"
            style={{
              background: accent,
              color: onAccent,
              ["--d" as string]: `${260 + buttons.length * 55}ms`,
            }}
          >
            Save
          </SaveContact>
        </div>
      </div>
    </div>
  );
}
