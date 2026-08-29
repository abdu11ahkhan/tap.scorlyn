import { ArrowUpRight } from "lucide-react";
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
/**
 * PORTFOLIO — mixed tile sizes.
 *
 * Every third image gets a double-width tile, so the grid has a rhythm instead
 * of reading as a spreadsheet of squares. Deterministic on index rather than
 * random: the layout has to be the same every time someone opens the card.
 */
export default function MosaicCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#0F0F12");
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
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-12">
        <header className="card-rise flex items-center gap-3.5 px-1">
          <div
            className="card-avatar flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: `${accent}33` }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[18px] font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="card-name truncate text-[18px] font-bold tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="card-headline truncate text-[13px] font-semibold" style={{ color: theme.fgMuted }}>{role}</p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-bio card-rise mt-5 px-1 text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "60ms" }}
          >{card.bio}</p>
        )}

        {gallery.length > 0 && (
          <div className="mt-7 grid grid-cols-2 gap-2">
            {gallery.map((item, index) => {
              const wide = index % 3 === 0;
              return (
                <figure
                  key={index}
                  className={`card-rise overflow-hidden rounded-xl bg-white/[0.04] ${
                    wide ? "col-span-2" : ""
                  }`}
                  style={{ ["--d" as string]: `${120 + index * 45}ms` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || `${card.full_name}'s work`}
                    className={`w-full object-cover ${wide ? "aspect-[2/1]" : "aspect-square"}`}
                  />
                  {item.caption && (
                    <figcaption className="px-3 py-2 text-[11px] font-semibold" style={{ color: theme.fgMuted }}>
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}

        <nav className="mt-8 space-y-0.5 px-1">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.kind}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group flex min-h-11 items-center gap-3 border-b py-3 text-[14px] font-semibold transition-colors hover:[border-color:var(--fg)]"
                style={{ borderColor: theme.border, ["--fg" as string]: theme.fgDim, ["--d" as string]: `${220 + index * 45}ms` }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: ink }} />
                <span className="min-w-0 flex-1 truncate">{button.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: theme.fgMuted }} />
              </a>
            );
          })}
        </nav>

      </main>
    </div>
  );
}
