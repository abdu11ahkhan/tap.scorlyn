import { ArrowUpRight, MapPin } from "lucide-react";
import {
  roleLine,
  accentOn,
  fontStack,
  readableOn,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — full-bleed, one piece per screen.
 *
 * No margins and no grid. For work that is meant to be looked at rather than
 * scanned: photography, interiors, food. The name sits over the first image,
 * so the work is the first thing on screen rather than a header.
 */
export default function LookbookCard({
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
  const ink = accentOn(accent, "dark");
  const gallery = resolveGallery(card.gallery);
  const [lead, ...rest] = gallery;

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Lead image with the identity over it. Falls back to the avatar so a
          card with no gallery yet still has a cover rather than a gap. */}
      <header className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
        {lead?.url || card.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lead?.url ?? card.avatar_url ?? ""}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: accent }} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6">
          <h1 className="card-rise text-[clamp(2.2rem,10vw,3.4rem)] font-bold leading-[0.95] tracking-tight">
            {card.full_name}
          </h1>
          {role && (
            <p
              className="card-rise mt-2 text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: ink, ["--d" as string]: "80ms" }}
            >
              {role}
            </p>
          )}
          {card.location && (
            <p className="card-rise mt-2 flex items-center gap-1.5 text-[12px] font-medium text-white/45">
              <MapPin className="h-3 w-3" />
              {card.location}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-8">
        {card.bio && (
          <p className="text-[16px] leading-relaxed text-white/60">{card.bio}</p>
        )}

        {rest.length > 0 && (
          <div className="mt-8 space-y-8">
            {rest.map((item, index) => (
              <figure key={index} className="card-rise" style={{ ["--d" as string]: `${index * 70}ms` }}>
                <div className="-mx-5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption ?? ""} className="w-full" />
                </div>
                {item.caption && (
                  <figcaption className="mt-2.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-white/35">
                    {item.caption}
                  </figcaption>
                )}
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
              className="flex items-center justify-between border-b border-white/12 py-3.5 text-[15px] font-semibold transition-colors hover:border-white/50"
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4 text-white/35" />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-8 flex h-12 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
