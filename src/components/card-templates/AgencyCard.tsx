import { ArrowUpRight, MapPin } from "lucide-react";
import {
  fontStack,
  initialsOf,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * SECTIONED — cover photo, services, work, contact. The closest thing here to
 * a small company site, all on one page with jump nav.
 */
export default function AgencyCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  // Every text/border tone below is resolved once, against whatever the
  // owner actually chose as a surface — not this template's own near-black
  // assumption. On the native surface every value below matches what the
  // literal #0D0D0F/white pair used to produce exactly.
  const theme = resolveCardTheme(card, "#0D0D0F");
  const { accent, accentText: ink, onAccent } = theme;
  const gallery = resolveGallery(card.gallery);
  const cover = card.cover_url;
  // The sticky nav, hero scrim and avatar ring sit inside the root and need
  // to read the resolved surface directly rather than the template's own
  // native tone.
  const tone = theme.surface;

  const sections = [
    { id: "top", label: "home" },
    ...(buttons.length ? [{ id: "services", label: "services" }] : []),
    ...(gallery.length ? [{ id: "work", label: "work" }] : []),
    { id: "contact", label: "contact" },
  ];

  return (
    <div
      className="min-h-screen scroll-smooth"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <nav
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ backgroundColor: `${tone}E6`, borderColor: theme.border }}
      >
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-black lowercase transition-colors hover:bg-white/10 hover:[color:var(--fg)]"
              style={{ color: theme.fgDim, ["--fg" as string]: theme.fg }}
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Hero with cover photo */}
      <section id="top" className="relative scroll-mt-14 overflow-hidden">
        <div className="relative h-64">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="gradient-pan h-full w-full"
              style={{
                backgroundImage: `radial-gradient(at 20% 30%, ${accent} 0px, transparent 60%), radial-gradient(at 80% 70%, ${accent}77 0px, transparent 60%)`,
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `linear-gradient(to top, ${tone} 0%, ${tone}80 55%, transparent 100%)` }}
          />
        </div>

        <div className="relative -mt-14 px-6 pb-10">
          <div
            className="card-avatar flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-4"
            style={{ background: accent, color: onAccent, borderColor: tone }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[24px] font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <h1 className="card-name mt-4 text-[36px] font-black leading-[0.95] tracking-tighter">{card.full_name}</h1>
          {card.headline && (
            <p className="card-headline mt-2 text-[13px] font-black uppercase tracking-[0.2em]" style={{ color: ink }}>{card.headline}</p>
          )}
          <div className="card-location mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold" style={{ color: theme.fgDim }}>
            {card.company && <span className="card-company">{card.company}</span>}
            {card.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {card.location}
              </span>
            )}
          </div>
          {card.bio && (
            <p className="card-bio mt-5 text-[15px] leading-relaxed" style={{ color: theme.fgDim }}>{card.bio}</p>
          )}
        </div>
      </section>

      {/* Services */}
      {buttons.length > 0 && (
        <section id="services" className="scroll-mt-14 border-t px-6 py-11" style={{ borderColor: theme.border }}>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
            services
          </h2>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {buttons.map((button, index) => {
              const Icon = iconFor(button.kind);
              return (
                <a
                  key={`${button.href}-${index}`}
                  href={button.href}
                  target={button.external ? "_blank" : undefined}
                  rel={button.external ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-white/30"
                  style={{ borderWidth: 1, borderStyle: "solid", borderColor: theme.border }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${accent}26`, color: ink }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-[15px] font-bold">{button.label}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: theme.fgMuted }} />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Work */}
      {gallery.length > 0 && (
        <section id="work" className="scroll-mt-14 border-t px-6 py-11" style={{ borderColor: theme.border }}>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
            selected work
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {gallery.map((item, index) => (
              <a
                key={index}
                href={item.href || undefined}
                target={item.href ? "_blank" : undefined}
                rel={item.href ? "noopener noreferrer" : undefined}
                className="group relative aspect-square overflow-hidden rounded-2xl"
                style={{ borderWidth: 1, borderStyle: "solid", borderColor: theme.border }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption || `${card.full_name}'s work`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.caption && (
                  // Sits on the thumbnail's own permanent black scrim, not the
                  // page surface, so it stays literal white regardless of theme.
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-[13px] font-black text-white">
                    {item.caption}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section
        id="contact"
        className="scroll-mt-14 border-t px-6 py-14 text-center"
        style={{ borderColor: theme.border }}
      >
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
          work with us
        </h2>
        <p className="mt-4 text-[24px] font-black tracking-tight">Let&apos;s talk.</p>
        <SaveContact
          card={card}
          className="mt-6 inline-flex items-center justify-center rounded-full px-8 py-4 text-[13px] font-black uppercase tracking-tight"
          style={{ background: accent, color: onAccent }}
        >
          save to contacts
        </SaveContact>
      </section>
    </div>
  );
}
