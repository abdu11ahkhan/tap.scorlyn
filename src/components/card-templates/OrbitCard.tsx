import { MapPin } from "lucide-react";
import { fontStack, initialsOf, readableOn, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Icon-only: the links are a row of round buttons under the name.
 *
 * Labels are the thing that makes a link list long, and on a card handed over
 * face to face nobody reads them — an Instagram glyph is recognised faster
 * than the word. Every button keeps an aria-label so the meaning survives for
 * a screen reader and on hover.
 */
export default function OrbitCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#111111";
  const onAccent = readableOn(accent);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0B0B0F] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <div
        className="float-orb pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: accent }}
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-col items-center px-6 pb-28 pt-24 text-center">
        <div className="card-rise relative">
          <span
            className="pulse-ring absolute inset-0 rounded-full border"
            style={{ borderColor: accent }}
          />
          <div
            className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}26`, boxShadow: `0 0 0 2px ${accent}55` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold" style={{ color: accent }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
        </div>

        <h1
          className="card-rise mt-7 text-4xl font-bold tracking-tight"
          style={{ ["--d" as string]: "80ms" }}
        >
          {card.full_name}
        </h1>

        {card.headline && (
          <p
            className="card-rise mt-2 text-sm font-medium"
            style={{ color: accent, ["--d" as string]: "140ms" }}
          >
            {card.headline}
          </p>
        )}

        {card.location && (
          <p
            className="card-rise mt-3 flex items-center gap-1.5 text-xs font-medium text-white/40"
            style={{ ["--d" as string]: "180ms" }}
          >
            <MapPin className="h-3 w-3" />
            {card.location}
          </p>
        )}

        {card.bio && (
          <p
            className="card-rise mt-5 max-w-[19rem] text-[15px] leading-relaxed text-white/55"
            style={{ ["--d" as string]: "220ms" }}
          >
            {card.bio}
          </p>
        )}

        {/* The links. Wraps to as many rows as it needs — a card with twelve
            links stays one screen instead of twelve stacked bars. */}
        <nav className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
                className="card-rise group flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] transition-all duration-200 hover:-translate-y-1"
                style={{
                  ["--d" as string]: `${260 + index * 60}ms`,
                }}
              >
                <Icon
                  className="h-5 w-5 text-white/75 transition-colors group-hover:text-white"
                  style={{ color: undefined }}
                />
                <span
                  className="pointer-events-none absolute h-14 w-14 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ boxShadow: `0 0 0 2px ${accent}` }}
                />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-10 inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-semibold"
          style={{
            background: accent,
            color: onAccent,
            ["--d" as string]: `${320 + buttons.length * 60}ms`,
          }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
