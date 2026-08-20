import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  resolveCardTheme,
  resolveGallery,
  roleLine,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * LANDING — a price list.
 *
 * Gallery captions become the line items, so a barber, a tutor or a caterer
 * can put their services and prices on the card without a separate field for
 * it. Write the caption as "Fade — Rs.800" and the dash splits the row.
 *
 * The first button is promoted to a filled CTA below the list — "book",
 * "order", "call" — the way a real menu ends on how to actually get the
 * thing, not another link in a row of equal links.
 */
export default function MenuCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#FCFBF7");
  const { accent, accentText: ink } = theme;
  const role = roleLine(card);
  const gallery = resolveGallery(card.gallery);
  const [primary, ...rest] = buttons;

  // "Item — Rs.800" reads as two columns; anything else stays one.
  const items = gallery.map((g) => {
    const parts = (g.caption ?? "").split(/\s[—–-]\s/);
    return parts.length > 1
      ? { name: parts[0].trim(), price: parts.slice(1).join(" - ").trim(), url: g.url }
      : { name: (g.caption ?? "").trim(), price: "", url: g.url };
  });

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-14">
        <header className="card-rise text-center">
          <h1 className="card-name text-[2.6rem] font-bold leading-none tracking-tight">{card.full_name}</h1>
          {role && (
            <p
              className="card-headline mt-2 text-[11px] font-bold uppercase tracking-[0.3em]"
              style={{ color: ink }}
            >{role}</p>
          )}
          {card.bio && (
            <p
              className="card-bio mx-auto mt-4 max-w-[21rem] text-[15px] leading-relaxed"
              style={{ color: theme.fgDim }}
            >{card.bio}</p>
          )}
        </header>

        {items.length > 0 && (
          <section className="mt-9">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1" style={{ background: theme.border }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
                what we do
              </span>
              <span className="h-px flex-1" style={{ background: theme.border }} />
            </div>

            <ul className="mt-5 space-y-3.5">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="card-rise flex items-baseline gap-3"
                  style={{ ["--d" as string]: `${100 + index * 55}ms` }}
                >
                  {/* min-w-0: without it a flex item won't shrink past its
                      own content width, so a long name pushed the leader to
                      its floor and squeezed the price into wrapping. Letting
                      the name wrap first is what a real printed menu does —
                      the price never moves. */}
                  <span className="min-w-0 text-[15px] font-semibold">{item.name || "—"}</span>
                  {/* Dotted leader, the way a printed menu does it. */}
                  <span
                    className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted"
                    style={{ borderColor: theme.border }}
                  />
                  {item.price && (
                    <span
                      className="shrink-0 whitespace-nowrap text-[15px] font-bold tabular-nums"
                      style={{ color: ink }}
                    >
                      {item.price}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {rest.length > 0 && (
          <nav className="mt-9 space-y-2">
            {rest.map((button, index) => {
              const Icon = iconFor(button.kind);
              return (
                <a
                  key={`${button.kind}-${index}`}
                  href={button.href}
                  target={button.external ? "_blank" : undefined}
                  rel={button.external ? "noopener noreferrer" : undefined}
                  className="flex min-h-11 items-center gap-3 rounded-lg border px-4 text-[14px] font-semibold transition-colors"
                  style={{ borderColor: theme.border }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: theme.fgMuted }} />
                  <span className="min-w-0 flex-1">{button.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: theme.fgMuted }} />
                </a>
              );
            })}
          </nav>
        )}

        {/* The one thing a menu actually needs at the end: how to get the
            thing. Promoted above Save-to-contacts, not beside it. */}
        {primary && (
          <a
            href={primary.href}
            target={primary.external ? "_blank" : undefined}
            rel={primary.external ? "noopener noreferrer" : undefined}
            className="card-rise mt-7 flex h-14 items-center justify-center gap-2 rounded-lg text-[15px] font-bold"
            style={{ background: accent, color: theme.onAccent }}
          >
            {primary.label}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}

        <SaveContact
          card={card}
          className="mt-3 flex h-12 items-center justify-center rounded-lg border text-[13px] font-bold transition-colors"
          style={{ borderColor: theme.border, color: theme.fgDim }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
