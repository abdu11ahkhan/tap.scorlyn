import { ArrowUpRight, MapPin } from "lucide-react";
import {
  roleLine,
  readableOn,
  accentOn,
  fontStack,
  initialsOf,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — staggered columns.
 *
 * CSS columns rather than a grid, so images keep their own proportions instead
 * of being cropped to a square. Work that is half tall photographs and half
 * wide screenshots survives this layout; a fixed grid mangles it.
 */
export default function MasonryCard({
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
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-white text-[#111]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-12">
        <header className="card-rise flex items-center gap-3.5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}1F` }}
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
            {card.location && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-neutral-400">
                <MapPin className="h-3 w-3" />
                {card.location}
              </p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-rise mt-5 text-[15px] leading-relaxed text-neutral-600"
            style={{ ["--d" as string]: "60ms" }}
          >
            {card.bio}
          </p>
        )}

        {gallery.length > 0 && (
          <div className="mt-7 columns-2 gap-3 [column-fill:_balance]">
            {gallery.map((item, index) => (
              <figure
                key={index}
                className="card-rise mb-3 break-inside-avoid overflow-hidden rounded-xl bg-neutral-100"
                style={{ ["--d" as string]: `${120 + index * 50}ms` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.caption ?? ""} className="w-full" />
                {item.caption && (
                  <figcaption className="px-2.5 py-2 text-[11px] font-semibold text-neutral-500">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <nav className="mt-8 space-y-2.5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="card-rise flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3.5 text-[15px] font-semibold transition-colors hover:border-neutral-900"
              style={{ ["--d" as string]: `${200 + index * 50}ms` }}
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4 text-neutral-400" />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-6 flex h-12 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
