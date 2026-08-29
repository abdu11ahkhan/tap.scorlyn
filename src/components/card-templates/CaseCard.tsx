import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";

import BackgroundEffect from "./BackgroundEffect";
/**
 * PORTFOLIO — one project, told properly.
 *
 * A numbered run of image-and-caption pairs rather than a gallery. For work
 * that needs explaining — a rebrand, a build, a renovation — where the
 * captions carry as much as the pictures.
 */
export default function CaseCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#ffffff");
  const { accent, accentText: ink } = theme;
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-16">
        <p
          className="card-company card-rise text-[11px] font-bold uppercase tracking-[0.3em]"
          style={{ color: ink }}
        >{card.company || "Selected work"}</p>

        <h1
          className="card-name card-rise mt-3 text-[2.4rem] font-bold leading-[1.05] tracking-tight"
          style={{ ["--d" as string]: "60ms" }}
        >{card.full_name}</h1>

        {card.headline && (
          <p
            className="card-location card-rise mt-2 text-[15px] font-semibold"
            style={{ color: theme.fgDim, ["--d" as string]: "110ms" }}
          >
            {card.headline}
            {card.location ? ` · ${card.location}` : ""}
          </p>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 border-l-2 pl-4 text-[15px] leading-relaxed"
            style={{ borderColor: accent, color: theme.fgDim, ["--d" as string]: "160ms" }}
          >{card.bio}</p>
        )}

        {gallery.length > 0 && (
          <div className="mt-10 space-y-10">
            {gallery.map((item, index) => (
              <section
                key={index}
                className="card-rise"
                style={{ ["--d" as string]: `${200 + index * 70}ms` }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: ink }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1" style={{ background: `${accent}33` }} />
                </div>

                <div className="mt-3 overflow-hidden rounded-lg bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption || `${card.full_name}'s work`} className="w-full" />
                </div>

                {item.caption && (
                  <p className="mt-3 text-[13px] leading-relaxed" style={{ color: theme.fgDim }}>
                    {item.caption}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        <nav className="mt-12 space-y-0.5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex min-h-11 items-center justify-between border-b py-3.5 text-[15px] font-semibold transition-colors hover:[border-color:var(--fg)]"
              style={{ borderColor: theme.border, ["--fg" as string]: theme.fg }}
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4" style={{ color: theme.fgMuted }} />
            </a>
          ))}
        </nav>

      </main>
    </div>
  );
}
