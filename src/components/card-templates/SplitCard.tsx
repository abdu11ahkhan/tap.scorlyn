import { ArrowUpRight, MapPin } from "lucide-react";
import {
  accentOn,
  fontStack,
  initialsOf,
  readableOn,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * A living gradient panel carries the identity; a clean panel carries the
 * actions. On desktop the two sit side by side; on a phone they stack.
 */
export default function SplitCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#111111";
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "light");
  // The identity panel is filled with the accent, so its text has to adapt.
  const onAccent = readableOn(accent);

  return (
    <div
      className="min-h-screen bg-white text-neutral-900 md:flex"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Identity panel */}
      <aside
        className="gradient-pan relative overflow-hidden px-6 pt-16 pb-12 md:flex md:min-h-screen md:w-[42%] md:flex-col md:justify-center md:px-12"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}B0 45%, ${accent}E6)`,
          color: onAccent,
        }}
      >
        {/* Dot grid keeps the flat colour from looking like dead paint. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `radial-gradient(${onAccent} 1px, transparent 1px)`,
            backgroundSize: "18px 18px",
          }}
        />
        <div
          className="float-orb pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: `${onAccent}22` }}
        />

        <div className="card-rise relative" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full"
            style={{
              backgroundColor: `${onAccent}26`,
              boxShadow: `0 0 0 4px ${onAccent}1F, 0 12px 30px rgba(0,0,0,0.15)`,
            }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">{initialsOf(card.full_name)}</span>
            )}
          </div>
        </div>

        <h1
          className="card-rise relative mt-6 text-4xl font-bold leading-[1.05] tracking-tight"
          style={{ ["--d" as string]: "90ms" }}
        >
          {card.full_name}
        </h1>

        {card.headline && (
          <p
            className="card-rise relative mt-3 text-base font-medium opacity-90"
            style={{ ["--d" as string]: "150ms" }}
          >
            {card.headline}
          </p>
        )}

        {card.company && (
          <p
            className="card-rise relative mt-1 text-sm opacity-70"
            style={{ ["--d" as string]: "190ms" }}
          >
            {card.company}
          </p>
        )}

        {card.location && (
          <p
            className="card-rise relative mt-4 flex items-center gap-1.5 text-xs opacity-70"
            style={{ ["--d" as string]: "230ms" }}
          >
            <MapPin className="h-3.5 w-3.5" />
            {card.location}
          </p>
        )}
      </aside>

      {/* Actions panel */}
      <main className="px-6 py-12 md:flex md:max-w-lg md:flex-1 md:flex-col md:justify-center md:px-12">
        {card.bio && (
          <p
            className="card-rise mb-8 text-[15px] leading-relaxed text-neutral-600"
            style={{ ["--d" as string]: "260ms" }}
          >
            {card.bio}
          </p>
        )}

        <nav className="space-y-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group relative flex w-full items-center gap-3 overflow-hidden rounded-lg border-2 border-neutral-100 px-5 py-4 text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                style={{
                  color: ink,
                  ["--d" as string]: `${300 + index * 60}ms`,
                }}
              >
                {/* Accent wipes in from the left. */}
                <span
                  className="absolute inset-0 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                  style={{ background: `${accent}12` }}
                />
                <Icon className="relative h-[18px] w-[18px]" />
                <span className="relative flex-1 text-neutral-900">{button.label}</span>
                <ArrowUpRight className="relative h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-70" />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-8 text-xs font-semibold tracking-wide text-neutral-400 transition-colors hover:text-neutral-900"
          style={{ ["--d" as string]: `${320 + buttons.length * 60}ms` }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
