import { ArrowUpRight, MapPin } from "lucide-react";
import { accentOn, fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Pure black with glowing outlines — a lit sign at night. Everything is
 * stroke and glow, nothing is filled.
 */
export default function NeonCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#FF3D9A";
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "dark");
  const glow = `0 0 12px ${accent}, 0 0 34px ${accent}66`;

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-black text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <div
        className="float-orb pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[520px] -translate-x-1/2 rounded-full blur-[140px] opacity-30"
        style={{ background: accent }}
      />
      {/* Horizon grid */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-25"
        style={{
          backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <main className="relative mx-auto w-full max-w-sm px-6 pt-20 pb-28 text-center">
        <div
          className="card-rise relative mx-auto w-fit"
          style={{ ["--d" as string]: "0ms" }}
        >
          <div
            className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 bg-black"
            style={{ borderColor: accent, boxShadow: glow }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold" style={{ color: ink, textShadow: glow }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
        </div>

        <h1
          className="card-rise mt-7 text-4xl font-bold uppercase tracking-[0.02em]"
          style={{ textShadow: glow, ["--d" as string]: "80ms" }}
        >
          {card.full_name}
        </h1>

        {card.headline && (
          <p
            className="card-rise mt-3 text-xs uppercase tracking-[0.3em]"
            style={{ color: ink, ["--d" as string]: "140ms" }}
          >
            {card.headline}
          </p>
        )}

        {card.company && (
          <p
            className="card-rise mt-2 text-sm text-white/50"
            style={{ ["--d" as string]: "180ms" }}
          >
            {card.company}
          </p>
        )}

        {card.location && (
          <p
            className="card-rise mt-3 flex items-center justify-center gap-1.5 text-xs text-white/40"
            style={{ ["--d" as string]: "220ms" }}
          >
            <MapPin className="h-3.5 w-3.5" />
            {card.location}
          </p>
        )}

        {card.bio && (
          <p
            className="card-rise mt-6 text-sm leading-relaxed text-white/65"
            style={{ ["--d" as string]: "260ms" }}
          >
            {card.bio}
          </p>
        )}

        <nav className="mt-10 space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group flex w-full items-center gap-3 rounded-full border-2 bg-black/60 px-5 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  borderColor: `${accent}66`,
                  color: ink,
                  ["--d" as string]: `${300 + index * 60}ms`,
                  boxShadow: `0 0 0 0 ${accent}`,
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{button.label}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-7 block text-[11px] uppercase tracking-[0.3em] text-white/35 transition-colors hover:text-white"
          style={{ ["--d" as string]: `${340 + buttons.length * 60}ms` }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
