import { MapPin } from "lucide-react";
import { roleLine, accentOn, fontStack, initialsOf, readableOn, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

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
  const accent = card.accent_color || "#111111";
  const role = roleLine(card);
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "dark");
  const onAccent = readableOn(accent);

  return (
    <div
      className="relative flex min-h-screen flex-col bg-black text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
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

        <div className="absolute inset-x-0 bottom-0 px-6 pb-8">
          <h1 className="card-rise text-4xl font-bold leading-tight tracking-tight">
            {card.full_name}
          </h1>
          {role && (
            <p
              className="card-rise mt-1.5 text-sm font-semibold"
              style={{ color: ink, ["--d" as string]: "80ms" }}
            >
              {role}
            </p>
          )}
          {card.location && (
            <p
              className="card-rise mt-2 flex items-center gap-1.5 text-xs font-medium text-white/45"
              style={{ ["--d" as string]: "120ms" }}
            >
              <MapPin className="h-3 w-3" />
              {card.location}
            </p>
          )}
          {card.bio && (
            <p
              className="card-rise mt-3 max-w-sm text-[14px] leading-relaxed text-white/60"
              style={{ ["--d" as string]: "160ms" }}
            >
              {card.bio}
            </p>
          )}
        </div>
      </div>

      {/* The dock. Scrolls sideways rather than wrapping, so it stays one row
          however many links there are. */}
      <div className="shrink-0 border-t border-white/10 bg-black/80 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <nav className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1">
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
                className="card-rise flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] transition-transform duration-200 active:scale-95"
                style={{ ["--d" as string]: `${200 + index * 55}ms` }}
              >
                <Icon className="h-5 w-5 text-white/80" />
              </a>
            );
          })}

          </nav>

          {/* Outside the scroller. Inside it, the primary action slid off the
              right edge as soon as there were more than four links. */}
          <SaveContact
            card={card}
            className="card-rise flex h-14 shrink-0 items-center justify-center rounded-2xl px-5 text-sm font-bold"
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
