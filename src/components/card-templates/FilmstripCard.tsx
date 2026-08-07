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
 * PORTFOLIO — one image at a time, swiped sideways.
 *
 * Scroll-snap rather than a grid: a grid asks someone to choose what to look
 * at, a filmstrip shows them one piece properly and lets the thumb do the
 * rest. Better for a small number of strong images than a wall of thumbnails.
 */
export default function FilmstripCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#E11D48";
  const role = roleLine(card);
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "dark");
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-[#0B0B0F] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md pb-24 pt-12">
        <header className="card-rise flex items-center gap-3.5 px-5">
          <div
            className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}33` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="truncate text-[13px] font-semibold" style={{ color: ink }}>
                {role}
              </p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-rise mt-5 px-5 text-[15px] leading-relaxed text-white/55"
            style={{ ["--d" as string]: "60ms" }}
          >
            {card.bio}
          </p>
        )}

        {gallery.length > 0 && (
          <>
            {/* Padding on the track, not the page, so the first and last
                frames can still sit flush against the edges as you scroll. */}
            <div className="mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
              {gallery.map((item, index) => (
                <figure
                  key={index}
                  className="card-rise w-[78%] shrink-0 snap-center"
                  style={{ ["--d" as string]: `${120 + index * 60}ms` }}
                >
                  <div className="overflow-hidden rounded-2xl bg-white/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.caption ?? ""}
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </div>
                  {item.caption && (
                    <figcaption className="mt-2 text-[12px] font-semibold text-white/45">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
            <p className="mt-1 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/25">
              swipe →
            </p>
          </>
        )}

        <nav className="mt-8 space-y-2.5 px-5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="card-rise flex items-center justify-between rounded-xl border border-white/12 px-4 py-3.5 text-[15px] font-semibold transition-colors hover:border-white/40"
              style={{ ["--d" as string]: `${220 + index * 50}ms` }}
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4 text-white/35" />
            </a>
          ))}
        </nav>

        <div className="mt-6 px-5">
          <SaveContact
            card={card}
            className="flex h-12 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: accent, color: readableOn(accent) }}
          >
            Save to contacts
          </SaveContact>
        </div>
      </main>
    </div>
  );
}
