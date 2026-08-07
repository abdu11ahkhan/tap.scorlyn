import { ArrowUpRight } from "lucide-react";
import {
  roleLine,
  accentOn,
  fontStack,
  initialsOf,
  readableOn,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — mixed tile sizes.
 *
 * Every third image gets a double-width tile, so the grid has a rhythm instead
 * of reading as a spreadsheet of squares. Deterministic on index rather than
 * random: the layout has to be the same every time someone opens the card.
 */
export default function MosaicCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#7C3AED";
  const role = roleLine(card);
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "dark");
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-[#0F0F12] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-12">
        <header className="card-rise flex items-center gap-3.5 px-1">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: `${accent}33` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="truncate text-[13px] font-semibold text-white/45">
                {role}
              </p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-rise mt-5 px-1 text-[15px] leading-relaxed text-white/55"
            style={{ ["--d" as string]: "60ms" }}
          >
            {card.bio}
          </p>
        )}

        {gallery.length > 0 && (
          <div className="mt-7 grid grid-cols-2 gap-2">
            {gallery.map((item, index) => {
              const wide = index % 3 === 0;
              return (
                <figure
                  key={index}
                  className={`card-rise overflow-hidden rounded-xl bg-white/[0.04] ${
                    wide ? "col-span-2" : ""
                  }`}
                  style={{ ["--d" as string]: `${120 + index * 45}ms` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption ?? ""}
                    className={`w-full object-cover ${wide ? "aspect-[2/1]" : "aspect-square"}`}
                  />
                  {item.caption && (
                    <figcaption className="px-3 py-2 text-[11px] font-semibold text-white/40">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}

        <nav className="mt-8 grid grid-cols-2 gap-2">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="card-rise flex items-center justify-between gap-2 rounded-xl border border-white/12 px-3.5 py-3 text-[14px] font-semibold transition-colors hover:border-white/40"
              style={{ ["--d" as string]: `${220 + index * 45}ms` }}
            >
              <span className="truncate">{button.label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/35" />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-5 flex h-12 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
