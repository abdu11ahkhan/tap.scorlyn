import { ArrowUpRight, MapPin } from "lucide-react";
import {
  roleLine,
  accentOn,
  fontStack,
  initialsOf,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — work first.
 *
 * Each link becomes a tile in a gallery grid rather than a row in a list, so
 * a set of project links reads as a body of work.
 */
export default function GridCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#0EA5E9";
  const role = roleLine(card);
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "light");
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-[#FBFBFA] text-[#111]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pt-14 pb-24">
        {/* Compact identity bar — the work is the point, not the face. */}
        <header
          className="card-rise flex items-center gap-3.5 border-b border-black/10 pb-6"
          style={{ ["--d" as string]: "0ms" }}
        >
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}1F`, color: ink }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="truncate text-[13px] font-semibold" style={{ color: ink }}>
                {role}
              </p>
            )}
          </div>

          {card.location && (
            <span className="hidden items-center gap-1 text-[11px] font-bold text-black/40 sm:flex">
              <MapPin className="h-3 w-3" />
              {card.location}
            </span>
          )}
        </header>

        {card.bio && (
          <p
            className="card-rise mt-6 text-[15px] leading-relaxed text-black/60"
            style={{ ["--d" as string]: "80ms" }}
          >
            {card.bio}
          </p>
        )}

        <p
          className="card-rise mt-9 text-[11px] font-black uppercase tracking-[0.25em] text-black/35"
          style={{ ["--d" as string]: "120ms" }}
        >
          selected work
        </p>

        {/* Photo gallery, when there is one. Real images make this template. */}
        {gallery.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {gallery.map((item, index) => (
              <a
                key={index}
                href={item.href || undefined}
                target={item.href ? "_blank" : undefined}
                rel={item.href ? "noopener noreferrer" : undefined}
                className={`card-rise group relative overflow-hidden rounded-2xl border border-black/10 ${
                  index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"
                }`}
                style={{ ["--d" as string]: `${150 + index * 55}ms` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? ""}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-[13px] font-black text-white">
                    {item.caption}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* The gallery. First tile spans both columns so the grid has a lead. */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            const isLead = index === 0;
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                // Without real imagery these tiles are icon + label, so tall
                // boxes just read as empty. The lead keeps its full-width span
                // for hierarchy instead of extra height.
                className={`card-rise group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.1)] ${
                  isLead ? "col-span-2 h-28" : "h-28"
                }`}
                style={{ ["--d" as string]: `${160 + index * 60}ms` }}
              >
                {/* Tint wash that deepens on hover */}
                <span
                  className="pointer-events-none absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-20"
                  style={{ background: accent }}
                />
                <span
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${accent}26`, color: ink }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="relative flex items-end justify-between gap-2">
                  <span className="text-[15px] font-black leading-tight tracking-tight">
                    {button.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-black/25 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            );
          })}
        </div>

        <SaveContact
          card={card}
          className="card-rise mt-8 block text-center text-[11px] font-black uppercase tracking-[0.25em] text-black/35 hover:text-black"
          style={{ ["--d" as string]: `${200 + buttons.length * 60}ms` }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
