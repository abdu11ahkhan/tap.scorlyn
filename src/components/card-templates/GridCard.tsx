import { ArrowUpRight, MapPin } from "lucide-react";
import {
  roleLine,
  fontStack,
  initialsOf,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
/**
 * PORTFOLIO — work first.
 *
 * Each link becomes a tile in a gallery grid rather than a row in a list, so
 * a set of project links reads as a body of work.
 */
export default function GridCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#FBFBFA");
  const { accent, accentText: ink } = theme;
  const role = roleLine(card);
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <main className="mx-auto w-full max-w-md px-6 pt-14 pb-24">
        {/* Compact identity bar — the work is the point, not the face. */}
        <header
          className="card-rise flex items-center gap-3.5 border-b pb-6"
          style={{ borderColor: theme.border, ["--d" as string]: "0ms" }}
        >
          <div
            className="card-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `${accent}1F`, color: ink }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[13px] font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="card-name truncate text-[18px] font-black tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="card-headline truncate text-[13px] font-semibold" style={{ color: ink }}>{role}</p>
            )}
          </div>

          {card.location && (
            <span className="card-location hidden items-center gap-1 text-[11px] font-bold sm:flex" style={{ color: theme.fgMuted }}>
              <MapPin className="h-3 w-3" />
              {card.location}
            </span>
          )}
        </header>

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "80ms" }}
          >{card.bio}</p>
        )}

        <p
          className="card-rise mt-9 text-[11px] font-black uppercase tracking-[0.25em]"
          style={{ color: theme.fgMuted, ["--d" as string]: "120ms" }}
        >
          selected work
        </p>

        {/* Photo gallery, when there is one. Real images make this template. */}
        {gallery.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {gallery.map((item, index) => (
              <a
                key={index}
                href={item.href || undefined}
                target={item.href ? "_blank" : undefined}
                rel={item.href ? "noopener noreferrer" : undefined}
                className={`card-rise group relative overflow-hidden rounded-2xl border ${
                  index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"
                }`}
                style={{ borderColor: theme.border, ["--d" as string]: `${150 + index * 55}ms` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption || `${card.full_name}'s work`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-[13px] font-black text-white">
                    {item.caption}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient"} />
        ) : (
          <nav className="mt-6 space-y-0.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group flex min-h-11 items-center gap-3 border-b py-3 text-[15px] font-black tracking-tight transition-colors hover:[border-color:var(--fg)]"
                style={{ borderColor: theme.border, ["--fg" as string]: theme.fg, ["--d" as string]: `${160 + index * 60}ms` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${accent}26`, color: ink }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate">{button.label}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: theme.fgMuted }} />
              </a>
            );
          })}
        </nav>
        )}

      </main>
    </div>
  );
}
