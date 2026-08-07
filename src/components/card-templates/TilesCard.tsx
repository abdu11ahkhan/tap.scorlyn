import { MapPin } from "lucide-react";
import { roleLine, accentOn, fontStack, initialsOf, readableOn, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Icon-only, as a grid of square tiles.
 *
 * The other icon layout sets the links in a row; this one gives each a large
 * square target, which is what you want when the card is being tapped in a
 * hurry. Three across is the widest that keeps a 44px-plus target on the
 * narrowest phone.
 */
export default function TilesCard({
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
  const ink = accentOn(accent, "light");
  const onAccent = readableOn(accent);

  return (
    <div
      className="relative min-h-screen bg-[#F4F4F2] text-neutral-900"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-sm px-5 pb-28 pt-16">
        <header className="card-rise flex items-center gap-4">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: `${accent}1F` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="truncate text-sm font-medium" style={{ color: ink }}>
                {role}
              </p>
            )}
            {card.location && (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-neutral-400">
                <MapPin className="h-3 w-3" />
                {card.location}
              </p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-rise mt-6 text-[15px] leading-relaxed text-neutral-600"
            style={{ ["--d" as string]: "80ms" }}
          >
            {card.bio}
          </p>
        )}

        <nav className="mt-8 grid grid-cols-3 gap-3">
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
                className="card-rise flex aspect-square items-center justify-center rounded-2xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-neutral-900"
                style={{ ["--d" as string]: `${120 + index * 55}ms` }}
              >
                <Icon className="h-6 w-6" style={{ color: ink }} />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-8 flex h-13 items-center justify-center rounded-2xl py-4 text-sm font-semibold"
          style={{
            background: accent,
            color: onAccent,
            ["--d" as string]: `${180 + buttons.length * 55}ms`,
          }}
        >
          Save to contacts
        </SaveContact>

        <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-400">
          @{card.username}
        </p>
      </main>
    </div>
  );
}
