import { MapPin } from "lucide-react";
import { roleLine, fontStack, initialsOf, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
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
  const role = roleLine(card);
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own light-grey
  // assumption. On the native surface every value below matches what the
  // literal #F4F4F2/neutral-900 pair used to produce exactly.
  const theme = resolveCardTheme(card, "#F4F4F2");
  const { accent, accentText: ink, onAccent } = theme;

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <main className="mx-auto w-full max-w-sm px-5 pb-28 pt-16">
        <header className="card-rise flex items-center gap-4">
          <div
            className="card-avatar flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: `${accent}1F` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[18px] font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="card-name truncate text-[24px] font-bold tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="card-headline truncate text-[13px] font-medium" style={{ color: ink }}>{role}</p>
            )}
            {card.location && (
              <p className="card-location mt-0.5 flex items-center gap-1 text-[11px] font-medium" style={{ color: theme.fgMuted }}>
                <MapPin className="h-3 w-3" />
                {card.location}
              </p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "80ms" }}
          >{card.bio}</p>
        )}

        <nav className="mt-8 grid grid-cols-3 gap-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            const primary = index === 0;
            return (
              <a
                key={`${button.kind}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                title={button.label}
                aria-label={button.label}
                className={`card-rise flex aspect-square items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-1 ${
                  primary ? "" : "border bg-white hover:border-neutral-900"
                }`}
                style={
                  primary
                    ? { background: accent, ["--d" as string]: `${120 + index * 55}ms` }
                    : { borderColor: theme.border, ["--d" as string]: `${120 + index * 55}ms` }
                }
              >
                <Icon className="h-6 w-6" style={{ color: primary ? onAccent : ink }} />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-8 flex h-13 items-center justify-center rounded-2xl py-4 text-[13px] font-semibold"
          style={{
            background: accent,
            color: onAccent,
            ["--d" as string]: `${180 + buttons.length * 55}ms`,
          }}
        >
          Save to contacts
        </SaveContact>

        <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
          @{card.username}
        </p>
      </main>
    </div>
  );
}
