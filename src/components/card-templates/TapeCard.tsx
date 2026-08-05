import { MapPin } from "lucide-react";
import { fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * Alternating tilts so the stack looks hand-placed rather than laid out.
 * Kept under ~2° — steeper angles make neighbouring strips overlap, and the
 * tape tab on each one needs clear space above it.
 */
const TILTS = ["-1.6deg", "1.2deg", "-0.9deg", "1.8deg", "-1.3deg", "0.8deg"];

/**
 * Scrapbook: polaroid avatar, washi tape, everything slightly crooked.
 * The playful one.
 */
export default function TapeCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#F59E0B";

  return (
    <div
      className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Torn-paper texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #0000 0 12px, #00000005 12px 24px)",
        }}
      />

      <main className="relative mx-auto w-full max-w-sm px-6 pt-16 pb-28">
        {/* Polaroid */}
        <div
          className="card-rise relative mx-auto w-fit -rotate-2 bg-white p-3 pb-10 shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
          style={{ ["--d" as string]: "0ms" }}
        >
          {/* Washi tape */}
          <span
            className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-4deg] opacity-70"
            style={{ background: accent }}
          />
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden bg-[#E8E4DA]">
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-4xl font-black text-[#1A1A1A]/25">
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
          <p className="absolute bottom-2.5 left-0 right-0 text-center text-sm font-bold italic">
            {card.full_name.split(" ")[0]}
          </p>
        </div>

        <div
          className="card-rise mt-8 text-center"
          style={{ ["--d" as string]: "90ms" }}
        >
          <h1 className="text-3xl font-black leading-tight tracking-tight">
            {card.full_name}
          </h1>
          {card.headline && (
            <span
              className="mt-2 inline-block -rotate-1 px-2 py-0.5 text-sm font-bold"
              style={{ background: `${accent}66` }}
            >
              {card.headline}
            </span>
          )}
          {card.company && (
            <p className="mt-2 text-sm text-[#1A1A1A]/55">{card.company}</p>
          )}
          {card.location && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#1A1A1A]/45">
              <MapPin className="h-3.5 w-3.5" />
              {card.location}
            </p>
          )}
        </div>

        {card.bio && (
          <p
            className="card-rise mx-auto mt-6 max-w-[19rem] rotate-[0.6deg] bg-white p-5 text-center text-[15px] leading-relaxed text-[#1A1A1A]/75 shadow-[0_6px_18px_rgba(0,0,0,0.1)]"
            style={{ ["--d" as string]: "150ms" }}
          >
            {card.bio}
          </p>
        )}

        {/* Generous gap: the tape tab sits above each strip, so tight spacing
            makes it land on the strip before it. */}
        <nav className="mt-10 space-y-6">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group relative flex w-full items-center gap-3 bg-white px-5 py-4 text-[15px] font-bold shadow-[0_5px_16px_rgba(0,0,0,0.1)] transition-all duration-300 hover:rotate-0 hover:shadow-[0_10px_26px_rgba(0,0,0,0.16)]"
                style={{
                  rotate: TILTS[index % TILTS.length],
                  ["--d" as string]: `${200 + index * 60}ms`,
                }}
              >
                {/* Tape holding each strip down */}
                <span
                  className="absolute -top-2 left-6 h-4 w-12 -rotate-3 opacity-60"
                  style={{ background: accent }}
                />
                <Icon className="h-[18px] w-[18px]" style={{ color: accent }} />
                <span className="flex-1 text-left">{button.label}</span>
                <span className="text-[#1A1A1A]/30 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            );
          })}
        </nav>

        <a
          href={`/api/vcard/${card.username}`}
          className="card-rise mt-8 block text-center text-xs font-bold text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
          style={{ ["--d" as string]: `${240 + buttons.length * 60}ms` }}
        >
          save to contacts
        </a>
      </main>
    </div>
  );
}
