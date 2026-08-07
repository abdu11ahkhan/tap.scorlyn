import { ArrowUpRight } from "lucide-react";
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
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — edge-to-edge photos, one after another.
 *
 * Driven by the gallery field. With no photos uploaded it shows numbered
 * placeholder frames rather than collapsing to nothing, so the layout still
 * reads in the picker.
 */
export default function ReelCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#EAB308";
  const role = roleLine(card);
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "dark");
  const gallery = resolveGallery(card.gallery);
  const slots = gallery.length > 0 ? gallery : [null, null, null];

  return (
    <div
      className="min-h-screen bg-[#0B0B0B] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Sticky identity strip so the name stays with you down the reel */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#0B0B0B]/85 px-5 py-3 backdrop-blur-xl">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ background: `${accent}33`, color: ink }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] font-black">{initialsOf(card.full_name)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black tracking-tight">{card.full_name}</p>
          {role && (
            <p className="truncate text-[11px] font-semibold text-white/45">
              {role}
            </p>
          )}
        </div>
        <SaveContact
          card={card}
          className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-widest"
          style={{ background: accent, color: readableOn(accent) }}
        >
          save
        </SaveContact>
      </header>

      {card.bio && (
        <p className="px-5 py-6 text-[15px] leading-relaxed text-white/60">{card.bio}</p>
      )}

      {/* The reel */}
      <div className="space-y-1">
        {slots.map((item, index) => {
          const inner = (
            <>
              {item?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.caption ?? ""}
                  className="h-[300px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div
                  className="flex h-[300px] w-full items-center justify-center"
                  style={{
                    background: `linear-gradient(140deg, ${accent}26, transparent)`,
                  }}
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/25">
                    photo {index + 1}
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item?.caption && (
                  <p className="mt-0.5 text-[15px] font-black tracking-tight">
                    {item.caption}
                  </p>
                )}
              </div>
            </>
          );

          return item?.href ? (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden"
            >
              {inner}
            </a>
          ) : (
            <div key={index} className="group relative overflow-hidden">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Links */}
      <nav className="space-y-2.5 px-5 py-8">
        {buttons.map((button, index) => {
          const Icon = iconFor(button.kind);
          return (
            <a
              key={`${button.href}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="group flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:border-white/30"
            >
              <Icon className="h-[18px] w-[18px]" style={{ color: ink }} />
              <span className="flex-1">{button.label}</span>
              <ArrowUpRight className="h-4 w-4 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          );
        })}
      </nav>
    </div>
  );
}
