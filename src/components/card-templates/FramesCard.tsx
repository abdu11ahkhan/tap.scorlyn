import { ArrowUpRight, MapPin } from "lucide-react";
import {
  roleLine,
  readableOn,
  fontStack,
  resolveCardTheme,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — prints laid on a table.
 *
 * Each image sits in a white frame with the caption written underneath, the
 * whole thing tilted a degree or two. Alternating, fixed angles rather than
 * random ones, so it looks placed rather than dropped — and so it looks the
 * same on every visit.
 */
export default function FramesCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#EFEAE1");
  const { accent, accentText: ink } = theme;
  const role = roleLine(card);
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-14">
        <header className="card-rise text-center">
          <h1 className="card-name text-[30px] font-bold tracking-tight">{card.full_name}</h1>
          {role && (
            <p className="card-headline mt-1.5 text-[13px] font-semibold uppercase tracking-[0.25em]" style={{ color: ink }}>{role}</p>
          )}
          {card.location && (
            <p className="card-location mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium" style={{ color: theme.fgMuted }}>
              <MapPin className="h-3 w-3" />
              {card.location}
            </p>
          )}
          {card.bio && (
            <p className="card-bio mx-auto mt-4 max-w-[20rem] text-[15px] leading-relaxed" style={{ color: theme.fgDim }}>{card.bio}</p>
          )}
        </header>

        {gallery.length > 0 && (
          <div className="mt-9 space-y-7">
            {gallery.map((item, index) => (
              <figure
                key={index}
                className="card-rise mx-auto w-[86%] bg-white p-3 pb-4 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                style={{
                  rotate: index % 2 === 0 ? "-1.6deg" : "1.4deg",
                  ["--d" as string]: `${120 + index * 70}ms`,
                }}
              >
                <div className="overflow-hidden bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || `${card.full_name}'s work`}
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-center text-[13px] font-semibold text-black/45">
                  {item.caption || `No. ${index + 1}`}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <nav className="mt-10 space-y-2.5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between rounded-full border bg-white/70 px-5 py-3.5 text-[15px] font-semibold transition-colors hover:[border-color:var(--fg)]"
              style={{ borderColor: theme.border, ["--fg" as string]: theme.fg }}
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4" style={{ color: theme.fgMuted }} />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-6 flex h-12 items-center justify-center rounded-full text-[13px] font-bold"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
