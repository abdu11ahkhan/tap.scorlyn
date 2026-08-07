import { MapPin } from "lucide-react";
import { accentOn, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Magazine spread: warm paper, serif, rules and small caps. Ignores the font
 * setting on purpose — the serif *is* the template.
 */
export default function EditorialCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#B45309";
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "light");

  return (
    <div
      className="min-h-screen bg-[#FAF6EF] text-[#1C1A17]"
      style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
    >
      <main className="mx-auto w-full max-w-sm px-7 pt-16 pb-28">
        <p
          className="card-rise text-center text-[11px] uppercase tracking-[0.35em]"
          style={{ color: ink, ["--d" as string]: "0ms" }}
        >
          {card.company || "Contact"}
        </p>

        <div
          className="card-rise mt-5 border-y py-7 text-center"
          style={{ borderColor: `${accent}44`, ["--d" as string]: "70ms" }}
        >
          <h1 className="text-[2.6rem] font-normal leading-[1.05] tracking-tight">
            {card.full_name}
          </h1>
          {card.headline && (
            <p className="mt-3 text-sm italic tracking-wide text-[#1C1A17]/65">
              {card.headline}
            </p>
          )}
        </div>

        <div
          className="card-rise mt-8 flex justify-center"
          style={{ ["--d" as string]: "130ms" }}
        >
          <div
            className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border"
            style={{ borderColor: `${accent}55` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
        </div>

        {card.bio && (
          <p
            className="card-rise mt-8 text-center text-[17px] leading-[1.75] text-[#1C1A17]/80"
            style={{ ["--d" as string]: "190ms" }}
          >
            {/* Drop cap — the one flourish this template gets. */}
            <span
              className="float-left mr-2 mt-1 text-[3.2rem] font-bold leading-[0.75]"
              style={{ color: ink }}
            >
              {card.bio.trim().charAt(0)}
            </span>
            {card.bio.trim().slice(1)}
          </p>
        )}

        {card.location && (
          <p
            className="card-rise mt-7 flex items-center justify-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[#1C1A17]/45"
            style={{ ["--d" as string]: "230ms" }}
          >
            <MapPin className="h-3 w-3" />
            {card.location}
          </p>
        )}

        <nav className="mt-10">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group flex w-full items-center gap-4 border-b py-4 transition-colors"
                style={{
                  borderColor: `${accent}30`,
                  ["--d" as string]: `${270 + index * 55}ms`,
                }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: ink }} />
                <span className="flex-1 text-[15px] tracking-wide transition-transform group-hover:translate-x-1">
                  {button.label}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-[#1C1A17]/35">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-9 block text-center text-[11px] uppercase tracking-[0.3em] text-[#1C1A17]/45 hover:text-[#1C1A17]"
          style={{ ["--d" as string]: `${310 + buttons.length * 55}ms` }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
