import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  initialsOf,
  readableOn,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * SECTIONED — a small studio site on one page.
 *
 * Jump links across the top, then work, then contact. The anchors are what
 * make this a "site" rather than a card: someone can be sent straight to the
 * work, or straight to how to reach you.
 */
export default function StudioCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#0F766E";
  const gallery = resolveGallery(card.gallery);

  const sections = [
    { id: "work", label: "work", show: gallery.length > 0 },
    { id: "contact", label: "contact", show: buttons.length > 0 },
  ].filter((s) => s.show);

  return (
    <div
      className="min-h-screen bg-white text-[#111]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <header
        id="top"
        className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur-md"
      >
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 py-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}1F` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold" style={{ color: accent }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
          <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
            {card.full_name}
          </span>
          <nav className="flex gap-3 text-[12px] font-semibold text-black/45">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="hover:text-black">
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-24">
        <section className="card-rise scroll-mt-16 pt-12">
          <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-tight">
            {card.headline || card.full_name}
          </h1>
          {card.company && (
            <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
              {card.company}
            </p>
          )}
          {card.bio && (
            <p className="mt-5 text-[16px] leading-relaxed text-neutral-600">{card.bio}</p>
          )}
          {card.location && (
            <p className="mt-3 text-[13px] font-semibold text-neutral-400">{card.location}</p>
          )}
        </section>

        {gallery.length > 0 && (
          <section id="work" className="scroll-mt-16 pt-14">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-black/35">
              work
            </h2>
            <div className="mt-4 space-y-4">
              {gallery.map((item, index) => (
                <figure
                  key={index}
                  className="card-rise overflow-hidden rounded-xl bg-neutral-100"
                  style={{ ["--d" as string]: `${index * 60}ms` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption ?? ""} className="w-full" />
                  {item.caption && (
                    <figcaption className="px-4 py-3 text-[13px] font-semibold text-neutral-600">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {buttons.length > 0 && (
          <section id="contact" className="scroll-mt-16 pt-14">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-black/35">
              contact
            </h2>
            <nav className="mt-4 space-y-2.5">
              {buttons.map((button, index) => (
                <a
                  key={`${button.kind}-${index}`}
                  href={button.href}
                  target={button.external ? "_blank" : undefined}
                  rel={button.external ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3.5 text-[15px] font-semibold transition-colors hover:border-neutral-900"
                >
                  {button.label}
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" />
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
          </section>
        )}
      </main>
    </div>
  );
}
