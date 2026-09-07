import { ArrowUpRight } from "lucide-react";
import { hueShift, readableOn, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * An alternate way to draw the link list, picked independently of the
 * template — see card.button_style. Every template still renders this
 * instead of its own native `<nav>` when the owner has chosen one of these,
 * but everything else about the template (photo, name, bio, layout) stays
 * exactly as designed. Self-contained on purpose: it resolves its own
 * colours from `card.accent_color` rather than taking a template's local
 * `theme`, so dropping it into any of the 42 templates is the same two
 * lines everywhere.
 */
export default function LinkButtons({
  card,
  buttons,
  style,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
  style: "badge" | "gradient";
}) {
  const accent = card.accent_color || "#111111";

  if (style === "badge") {
    return (
      <nav className="card-links mt-6 w-full space-y-3">
        {buttons.map((button, index) => {
          const Icon = iconFor(button.kind);
          // A different hue per link, always derived from the owner's own
          // accent — never a fixed rainbow — so the row reads as colourful
          // without introducing a second, unrelated palette.
          const bg = hueShift(accent, index * 34);
          const fg = readableOn(bg);
          return (
            <a
              key={`${button.href}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="card-rise group relative flex min-h-14 w-full items-center rounded-full py-2 pl-2 pr-5 text-[15px] font-black uppercase tracking-tight shadow-[0_10px_24px_-8px_rgba(0,0,0,0.35)] transition-transform active:scale-[0.98]"
              style={{ background: bg, color: fg, ["--d" as string]: `${index * 55}ms` }}
            >
              {/* The half-detached white icon badge from the reference —
                  overlapping the pill's own left edge rather than sitting
                  flush inside it. */}
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
                style={{ color: bg }}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="ml-4 min-w-0 flex-1 truncate">{button.label}</span>
            </a>
          );
        })}
      </nav>
    );
  }

  // "gradient"
  return (
    <nav className="card-links mt-6 w-full space-y-3">
      {buttons.map((button, index) => {
        const Icon = iconFor(button.kind);
        const to = hueShift(accent, 40);
        const fg = readableOn(accent);
        return (
          <a
            key={`${button.href}-${index}`}
            href={button.href}
            target={button.external ? "_blank" : undefined}
            rel={button.external ? "noopener noreferrer" : undefined}
            className="card-rise group flex min-h-14 w-full items-center gap-3 rounded-full px-6 text-[15px] font-bold shadow-[0_10px_28px_-10px_rgba(0,0,0,0.4)] transition-transform active:scale-[0.98]"
            style={{
              backgroundImage: `linear-gradient(120deg, ${accent}, ${to})`,
              color: fg,
              ["--d" as string]: `${index * 55}ms`,
            }}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="min-w-0 flex-1 truncate">{button.label}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
          </a>
        );
      })}
    </nav>
  );
}

/** True when the owner picked one of the shared looks above rather than the
 *  template's own native buttons — the one check every template needs. */
export function hasButtonOverride(card: Pick<CardProfile, "button_style">): boolean {
  return card.button_style === "badge" || card.button_style === "gradient";
}
