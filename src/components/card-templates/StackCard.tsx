import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * SECTIONED — a whole small site on one page.
 *
 * Hero / about / links / contact, with a sticky jump nav. Sections are plain
 * anchors, so navigation costs no JavaScript.
 */
export default function StackCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#059669";

  const sections = [
    { id: "top", label: "home" },
    ...(card.bio ? [{ id: "about", label: "about" }] : []),
    ...(buttons.length ? [{ id: "links", label: "links" }] : []),
    { id: "contact", label: "contact" },
  ];

  return (
    <div
      className="min-h-screen scroll-smooth bg-white text-[#101010]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Jump nav */}
      <nav className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-1 overflow-x-auto px-4 py-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-black lowercase text-black/50 transition-colors hover:bg-black/5 hover:text-black"
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-md px-6">
        {/* Hero */}
        <section id="top" className="scroll-mt-16 py-14 text-center">
          <div
            className="card-rise mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl"
            style={{ background: `${accent}1F`, color: accent, ["--d" as string]: "0ms" }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <h1
            className="card-rise mt-6 text-4xl font-black leading-[0.95] tracking-tighter"
            style={{ ["--d" as string]: "70ms" }}
          >
            {card.full_name}
          </h1>

          {card.headline && (
            <p
              className="card-rise mt-2.5 text-sm font-black uppercase tracking-[0.18em]"
              style={{ color: accent, ["--d" as string]: "120ms" }}
            >
              {card.headline}
            </p>
          )}

          <div
            className="card-rise mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-black/45"
            style={{ ["--d" as string]: "160ms" }}
          >
            {card.company && <span>{card.company}</span>}
            {card.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {card.location}
              </span>
            )}
          </div>
        </section>

        {/* About */}
        {card.bio && (
          <section id="about" className="scroll-mt-16 border-t border-black/10 py-12">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-black/35">
              about
            </h2>
            <p className="mt-4 text-[17px] leading-[1.7] text-black/75">{card.bio}</p>
          </section>
        )}

        {/* Links */}
        {buttons.length > 0 && (
          <section id="links" className="scroll-mt-16 border-t border-black/10 py-12">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-black/35">
              elsewhere
            </h2>
            <div className="mt-4 space-y-2.5">
              {buttons.map((button, index) => {
                const Icon = iconFor(button.kind);
                return (
                  <a
                    key={`${button.href}-${index}`}
                    href={button.href}
                    target={button.external ? "_blank" : undefined}
                    rel={button.external ? "noopener noreferrer" : undefined}
                    className="group flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3.5 text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: accent }} />
                    <span className="flex-1">{button.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-black/25 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Contact */}
        <section id="contact" className="scroll-mt-16 border-t border-black/10 py-14 text-center">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-black/35">
            get in touch
          </h2>
          <p className="mt-4 text-2xl font-black tracking-tight">
            Let&apos;s make something.
          </p>
          <a
            href={`/api/vcard/${card.username}`}
            className="mt-6 inline-flex h-13 items-center justify-center rounded-full px-8 py-3.5 text-sm font-black uppercase tracking-tight text-white"
            style={{ background: accent }}
          >
            save to contacts
          </a>
        </section>
      </main>
    </div>
  );
}
