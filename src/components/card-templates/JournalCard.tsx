import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";

import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";
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
  const theme = resolveCardTheme(card, "#FDFCF8");
  const { accentText: ink } = theme;
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={theme.accent} />
      <main className="mx-auto w-full max-w-[34rem] px-6 pb-24 pt-16">
        <header className="card-rise border-b pb-7" style={{ borderColor: theme.border }}>
          <p className="card-company text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: ink }}>{card.company || "Notes"}</p>
          <h1 className="card-name mt-3 font-serif text-[2.7rem] font-normal leading-[1.05] tracking-tight">{card.full_name}</h1>
          {card.headline && (
            <p className="card-location mt-2 font-serif text-[18px] italic" style={{ color: theme.fgMuted }}>
              {card.headline}
              {card.location ? `, ${card.location}` : ""}
            </p>
          )}
        </header>

        {card.bio && (
          <p
            className="card-bio card-rise mt-7 font-serif text-[18px] leading-[1.7]"
            style={{ color: theme.fgDim, ["--d" as string]: "60ms" }}
          >{card.bio}</p>
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
                  <img src={item.url} alt={item.caption || `${card.full_name}'s work`} className="w-full" />
                </div>
                {item.caption && (
                  <p className="mt-3 font-serif text-[15px] italic leading-relaxed" style={{ color: theme.fgMuted }}>
                    {item.caption}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient"} />
        ) : (
          <nav className="mt-12 border-t pt-7" style={{ borderColor: theme.border }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: theme.fgMuted }}>
            elsewhere
          </p>
          <div className="mt-4 space-y-1">
            {buttons.map((button, index) => (
              <a
                key={`${button.kind}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="flex items-center justify-between py-2.5 font-serif text-[18px] transition-colors hover:[color:var(--fg)]"
                style={{ color: ink, ["--fg" as string]: theme.fg }}
              >
                {button.label}
                <ArrowUpRight className="h-4 w-4 opacity-50" />
              </a>
            ))}
          </div>
        </nav>
        )}

      </main>
    </div>
  );
}
