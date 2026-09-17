import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
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
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own paper-white
  // assumption. On the native surface every value below matches what the
  // literal white/#101010 pair used to produce exactly.
  const theme = resolveCardTheme(card, "#FFFFFF");
  const { accent, accentText: ink } = theme;

  const sections = [
    { id: "top", label: "home" },
    ...(card.bio ? [{ id: "about", label: "about" }] : []),
    ...(buttons.length ? [{ id: "links", label: "links" }] : []),
    { id: "contact", label: "contact" },
  ];

  return (
    <div
      className="grain relative min-h-screen scroll-smooth overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      {/* Jump nav */}
      {hasButtonOverride(card) ? (
        <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
      ) : (
        <nav
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ backgroundColor: `${theme.surface}E6`, borderColor: theme.border }}
      >
        <div className="mx-auto flex max-w-md items-center gap-1 overflow-x-auto px-4 py-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-[13px] font-black lowercase transition-colors hover:bg-black/5 hover:[color:var(--fg)]"
              style={{ color: theme.fgDim, ["--fg" as string]: theme.fg }}
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>
      )}

      <main className="mx-auto w-full max-w-md px-6">
        {/* Hero */}
        <section id="top" className="scroll-mt-16 py-14 text-center">
          <div
            className="card-avatar card-rise mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl"
            style={{ background: `${accent}1F`, color: ink, ["--d" as string]: "0ms" }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[24px] font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <h1
            className="card-name card-rise mt-6 text-[36px] font-black leading-[0.95] tracking-tighter"
            style={{ ["--d" as string]: "70ms" }}
          >{card.full_name}</h1>

          {card.headline && (
            <p
              className="card-headline card-rise mt-2.5 text-[13px] font-black uppercase tracking-[0.2em]"
              style={{ color: ink, ["--d" as string]: "120ms" }}
            >{card.headline}</p>
          )}

          <div
            className="card-location card-rise mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold"
            style={{ color: theme.fgDim, ["--d" as string]: "160ms" }}
          >
            {card.company && <span className="card-company">{card.company}</span>}
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
          <section id="about" className="scroll-mt-16 border-t py-12" style={{ borderColor: theme.border }}>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
              about
            </h2>
            <p className="card-bio mt-4 text-[18px] leading-[1.7]" style={{ color: theme.fgDim }}>{card.bio}</p>
          </section>
        )}

        {/* Links */}
        {buttons.length > 0 && (
          <section id="links" className="scroll-mt-16 border-t py-12" style={{ borderColor: theme.border }}>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
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
                    className="group flex items-center gap-3 rounded-xl border px-4 py-3.5 text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                    style={{ borderColor: theme.border }}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: ink }} />
                    <span className="flex-1">{button.label}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: theme.fgMuted }} />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Contact. Extra bottom padding, not the family's usual py-14: this
            is the last thing on the page, and the platform's save/QR dock is
            permanently fixed to the bottom of the viewport — anything
            shorter left this section partially behind it once scrolled all
            the way down. */}
        <section id="contact" className="scroll-mt-16 border-t pt-14 pb-28 text-center" style={{ borderColor: theme.border }}>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
            get in touch
          </h2>
          <p className="mt-4 text-[24px] font-black tracking-tight">
            Let&apos;s make something.
          </p>
        </section>
      </main>
    </div>
  );
}
