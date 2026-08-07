import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Full-bleed gradient that slowly pans, with frosted glass on top. The accent
 * seeds the whole mesh rather than being a single highlight.
 */
export default function AuroraCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#A855F7";

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0B0614] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Living mesh */}
      <div
        className="gradient-pan pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: `radial-gradient(at 15% 20%, ${accent}CC 0px, transparent 55%), radial-gradient(at 85% 10%, #22D3EEAA 0px, transparent 50%), radial-gradient(at 75% 85%, ${accent}99 0px, transparent 55%), radial-gradient(at 20% 90%, #FF3D9A88 0px, transparent 50%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[#0B0614]/35" />

      <main className="relative mx-auto w-full max-w-sm px-5 pt-24 pb-28">
        <div
          className="card-rise flex flex-col items-center text-center"
          style={{ ["--d" as string]: "0ms" }}
        >
          <div className="relative">
            <span className="pulse-ring absolute inset-0 rounded-full border-2 border-white/60" />
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/15 backdrop-blur-xl">
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.avatar_url}
                  alt={card.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-light tracking-wide">
                  {initialsOf(card.full_name)}
                </span>
              )}
            </div>
          </div>

          <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight drop-shadow-lg">
            {card.full_name}
          </h1>

          {card.headline && (
            <p className="mt-2 text-base font-medium text-white/85">{card.headline}</p>
          )}
          {card.company && <p className="mt-0.5 text-sm text-white/60">{card.company}</p>}

          {card.location && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
              <MapPin className="h-3.5 w-3.5" />
              {card.location}
            </p>
          )}

          {card.bio && (
            <p className="mt-5 text-sm leading-relaxed text-white/75">{card.bio}</p>
          )}
        </div>

        <nav className="mt-9 space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise card-shine group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-[15px] font-semibold backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                style={{ ["--d" as string]: `${120 + index * 60}ms` }}
              >
                <Icon className="relative h-[18px] w-[18px]" />
                <span className="relative flex-1">{button.label}</span>
                <ArrowUpRight className="relative h-4 w-4 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-6 block text-center text-xs text-white/50 transition-colors hover:text-white"
          style={{ ["--d" as string]: `${160 + buttons.length * 60}ms` }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
