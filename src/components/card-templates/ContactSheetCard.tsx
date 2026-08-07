import { ArrowUpRight } from "lucide-react";
import {
  readableOn,
  fontStack,
  initialsOf,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — a photographer's contact sheet.
 *
 * Small, dense, numbered, on paper. Where the lookbook shows one piece
 * properly, this shows volume: the point is that there is a lot of it.
 */
export default function ContactSheetCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#111111";
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-[#F2F1EC] text-[#111]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-12">
        <header className="card-rise border-b-2 border-[#111] pb-4">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold uppercase tracking-tight">{card.full_name}</h1>
              {card.headline && (
                <p className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-black/45">
                  {card.headline}
                </p>
              )}
            </div>
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#111]"
              style={{ background: `${accent}1F` }}
            >
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[13px] font-bold">{initialsOf(card.full_name)}</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold uppercase tracking-widest text-black/40">
            {card.company && <span>{card.company}</span>}
            {card.location && <span>{card.location}</span>}
            {gallery.length > 0 && <span>{gallery.length} frames</span>}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-rise mt-5 text-[14px] leading-relaxed text-black/65"
            style={{ ["--d" as string]: "60ms" }}
          >
            {card.bio}
          </p>
        )}

        {gallery.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-1.5">
            {gallery.map((item, index) => (
              <figure
                key={index}
                className="card-rise"
                style={{ ["--d" as string]: `${100 + index * 35}ms` }}
              >
                <div className="overflow-hidden border border-[#111] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption ?? ""}
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <figcaption className="mt-1 truncate text-[9px] font-bold uppercase tracking-widest text-black/35">
                  {String(index + 1).padStart(2, "0")}
                  {item.caption ? ` ${item.caption}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <nav className="mt-8 space-y-2">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between border-b border-black/15 py-3 text-[14px] font-bold uppercase tracking-wide transition-colors hover:border-[#111]"
            >
              {button.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-7 flex h-12 items-center justify-center border-2 border-[#111] text-[13px] font-bold uppercase tracking-widest"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
