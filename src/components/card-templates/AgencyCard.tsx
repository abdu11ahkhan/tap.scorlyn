import { ArrowUpRight, MapPin } from "lucide-react";
import {
  accentOn,
  fontStack,
  initialsOf,
  readableOn,
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
  const accent = card.accent_color || "#F97316";
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "dark");
  const onAccent = readableOn(accent);
  const gallery = resolveGallery(card.gallery);
  const cover = card.cover_url;

  const sections = [
    { id: "top", label: "home" },
    ...(buttons.length ? [{ id: "services", label: "services" }] : []),
    ...(gallery.length ? [{ id: "work", label: "work" }] : []),
    { id: "contact", label: "contact" },
  ];

  return (
    <div
      className="min-h-screen scroll-smooth bg-[#0D0D0F] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#0D0D0F]/90 backdrop-blur-xl">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-black lowercase text-white/50 transition-colors hover:bg-white/10 hover:text-white"
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/50 to-transparent" />
        </div>

        <div className="relative -mt-14 px-6 pb-10">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#0D0D0F]"
            style={{ background: accent, color: onAccent }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-tighter">
            {card.full_name}
          </h1>
          {card.headline && (
            <p className="mt-2 text-sm font-black uppercase tracking-[0.18em]" style={{ color: ink }}>
              {card.headline}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-white/45">
            {card.company && <span>{card.company}</span>}
            {card.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {card.location}
              </span>
            )}
          </div>
          {card.bio && (
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">{card.bio}</p>
          )}
        </div>
      </section>

      {/* Services */}
      {buttons.length > 0 && (
        <section id="services" className="scroll-mt-14 border-t border-white/10 px-6 py-11">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/35">
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
                  className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-white/30"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${accent}26`, color: ink }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-[15px] font-bold">{button.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Work */}
      {gallery.length > 0 && (
        <section id="work" className="scroll-mt-14 border-t border-white/10 px-6 py-11">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/35">
            selected work
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {gallery.map((item, index) => (
              <a
                key={index}
                href={item.href || undefined}
                target={item.href ? "_blank" : undefined}
                rel={item.href ? "noopener noreferrer" : undefined}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-white/12"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? ""}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-[13px] font-black">
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
        className="scroll-mt-14 border-t border-white/10 px-6 py-14 text-center"
      >
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/35">
          work with us
        </h2>
        <p className="mt-4 text-2xl font-black tracking-tight">Let&apos;s talk.</p>
        <SaveContact
          card={card}
          className="mt-6 inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black uppercase tracking-tight"
          style={{ background: accent, color: onAccent }}
        >
          save to contacts
        </SaveContact>
      </section>
    </div>
  );
}
