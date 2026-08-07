import { ArrowUpRight, MapPin } from "lucide-react";
import {
  fontStack,
  initialsOf,
  readableOn,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Neo-brutalist: 2px black outlines, hard offset shadows, no gradients.
 * The house style, turned into a card.
 */
export default function StickerCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#CCFF00";
  const onAccent = readableOn(accent);

  return (
    <div
      className="min-h-screen bg-[#FFFDF5] text-ink"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Dot grid paper */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(#0a0a0a 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      <main className="relative mx-auto w-full max-w-sm px-5 pt-16 pb-28">
        <div
          className="card-rise sticker-lg rounded-[1.75rem] border-2 border-ink p-6"
          style={{ background: accent, color: onAccent, ["--d" as string]: "0ms" }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-ink bg-white">
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.avatar_url}
                  alt={card.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-ink">
                  {initialsOf(card.full_name)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl font-black leading-[0.9] tracking-tighter">
                {card.full_name}
              </h1>
              {card.headline && (
                <p className="mt-1.5 text-sm font-black uppercase tracking-tight opacity-80">
                  {card.headline}
                </p>
              )}
            </div>
          </div>

          {(card.company || card.location) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {card.company && (
                <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black text-ink">
                  {card.company}
                </span>
              )}
              {card.location && (
                <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black text-ink">
                  <MapPin className="h-3 w-3" />
                  {card.location}
                </span>
              )}
            </div>
          )}
        </div>

        {card.bio && (
          <p
            className="card-rise sticker mt-4 rounded-2xl border-2 border-ink bg-white p-5 text-[15px] font-semibold leading-relaxed"
            style={{ ["--d" as string]: "90ms" }}
          >
            {card.bio}
          </p>
        )}

        <nav className="mt-4 space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise sticker sticker-press group flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white px-5 py-4 text-[15px] font-black text-ink"
                style={{ ["--d" as string]: `${150 + index * 60}ms` }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink"
                  style={{ background: accent, color: onAccent }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left">{button.label}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-6 block text-center text-xs font-black uppercase tracking-widest text-ink/50 hover:text-ink"
          style={{ ["--d" as string]: `${190 + buttons.length * 60}ms` }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
