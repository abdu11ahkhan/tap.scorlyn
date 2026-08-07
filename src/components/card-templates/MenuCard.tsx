import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  readableOn,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * LANDING — a price list.
 *
 * Gallery captions become the line items, so a barber, a tutor or a caterer
 * can put their services and prices on the card without a separate field for
 * it. Write the caption as "Fade — Rs.800" and the dash splits the row.
 */
export default function MenuCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#166534";
  const gallery = resolveGallery(card.gallery);

  // "Item — Rs.800" reads as two columns; anything else stays one.
  const items = gallery.map((g) => {
    const parts = (g.caption ?? "").split(/\s[—–-]\s/);
    return parts.length > 1
      ? { name: parts[0].trim(), price: parts.slice(1).join(" - ").trim(), url: g.url }
      : { name: (g.caption ?? "").trim(), price: "", url: g.url };
  });

  return (
    <div
      className="min-h-screen bg-[#FCFBF7] text-[#12130F]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-14">
        <header className="card-rise text-center">
          <h1 className="text-[2.6rem] font-bold leading-none tracking-tight">
            {card.full_name}
          </h1>
          {card.headline && (
            <p
              className="mt-2 text-[12px] font-bold uppercase tracking-[0.28em]"
              style={{ color: accent }}
            >
              {card.headline}
            </p>
          )}
          {card.bio && (
            <p className="mx-auto mt-4 max-w-[21rem] text-[15px] leading-relaxed text-black/55">
              {card.bio}
            </p>
          )}
        </header>

        {items.length > 0 && (
          <section className="mt-9">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-black/15" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-black/35">
                what we do
              </span>
              <span className="h-px flex-1 bg-black/15" />
            </div>

            <ul className="mt-5 space-y-3.5">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="card-rise flex items-baseline gap-3"
                  style={{ ["--d" as string]: `${100 + index * 55}ms` }}
                >
                  <span className="text-[16px] font-semibold">{item.name || "—"}</span>
                  {/* Dotted leader, the way a printed menu does it. */}
                  <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-black/25" />
                  {item.price && (
                    <span className="text-[16px] font-bold tabular-nums" style={{ color: accent }}>
                      {item.price}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="mt-10 space-y-2.5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between rounded-lg border border-black/15 px-4 py-3.5 text-[15px] font-semibold transition-colors hover:border-black/50"
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4 text-black/35" />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-6 flex h-12 items-center justify-center rounded-lg text-sm font-bold"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
