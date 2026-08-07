import { ArrowUpRight, MapPin } from "lucide-react";
import {
  roleLine,
  readableOn,
  accentOn,
  fontStack,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — prints laid on a table.
 *
 * Each image sits in a white frame with the caption written underneath, the
 * whole thing tilted a degree or two. Alternating, fixed angles rather than
 * random ones, so it looks placed rather than dropped — and so it looks the
 * same on every visit.
 */
export default function FramesCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#B45309";
  const role = roleLine(card);
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "light");
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-[#EFEAE1] text-[#1A1A1A]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-14">
        <header className="card-rise text-center">
          <h1 className="text-3xl font-bold tracking-tight">{card.full_name}</h1>
          {role && (
            <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-[0.22em]" style={{ color: ink }}>
              {role}
            </p>
          )}
          {card.location && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] font-medium text-black/40">
              <MapPin className="h-3 w-3" />
              {card.location}
            </p>
          )}
          {card.bio && (
            <p className="mx-auto mt-4 max-w-[20rem] text-[15px] leading-relaxed text-black/60">
              {card.bio}
            </p>
          )}
        </header>

        {gallery.length > 0 && (
          <div className="mt-9 space-y-7">
            {gallery.map((item, index) => (
              <figure
                key={index}
                className="card-rise mx-auto w-[86%] bg-white p-3 pb-4 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                style={{
                  rotate: index % 2 === 0 ? "-1.6deg" : "1.4deg",
                  ["--d" as string]: `${120 + index * 70}ms`,
                }}
              >
                <div className="overflow-hidden bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption ?? ""}
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-center text-[13px] font-semibold text-black/50">
                  {item.caption || `No. ${index + 1}`}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <nav className="mt-10 space-y-2.5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between rounded-full border border-black/15 bg-white/70 px-5 py-3.5 text-[15px] font-semibold transition-colors hover:border-black/50"
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4 text-black/35" />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-6 flex h-12 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
