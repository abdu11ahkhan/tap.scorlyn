import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * SECTIONED — long-form, like a column.
 *
 * Serif, generous measure, dated entries. For writers, consultants and anyone
 * whose card should read as something written rather than something designed.
 */
export default function JournalCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#7C2D12";
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-[#FDFCF8] text-[#1A1714]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-[34rem] px-6 pb-24 pt-16">
        <header className="card-rise border-b border-black/10 pb-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>
            {card.company || "Notes"}
          </p>
          <h1 className="mt-3 font-serif text-[2.7rem] font-normal leading-[1.08] tracking-tight">
            {card.full_name}
          </h1>
          {card.headline && (
            <p className="mt-2 font-serif text-[17px] italic text-black/50">
              {card.headline}
              {card.location ? `, ${card.location}` : ""}
            </p>
          )}
        </header>

        {card.bio && (
          <p
            className="card-rise mt-7 font-serif text-[19px] leading-[1.65] text-black/75"
            style={{ ["--d" as string]: "60ms" }}
          >
            {card.bio}
          </p>
        )}

        {gallery.length > 0 && (
          <div className="mt-10 space-y-10">
            {gallery.map((item, index) => (
              <section
                key={index}
                id={`entry-${index + 1}`}
                className="card-rise scroll-mt-6"
                style={{ ["--d" as string]: `${140 + index * 70}ms` }}
              >
                <div className="overflow-hidden rounded-sm bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption ?? ""} className="w-full" />
                </div>
                {item.caption && (
                  <p className="mt-3 font-serif text-[15px] italic leading-relaxed text-black/50">
                    {item.caption}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        <nav className="mt-12 border-t border-black/10 pt-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-black/35">
            elsewhere
          </p>
          <div className="mt-4 space-y-1">
            {buttons.map((button, index) => (
              <a
                key={`${button.kind}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="flex items-center justify-between py-2.5 font-serif text-[17px] transition-colors hover:text-black"
                style={{ color: accent }}
              >
                {button.label}
                <ArrowUpRight className="h-4 w-4 opacity-50" />
              </a>
            ))}
          </div>
        </nav>

        <SaveContact
          card={card}
          className="mt-8 inline-flex font-serif text-[15px] italic text-black/45 underline underline-offset-4 hover:text-black"
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
