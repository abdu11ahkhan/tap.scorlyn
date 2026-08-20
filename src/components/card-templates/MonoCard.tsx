import { fontStack, initialsOf, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Monospace grid, live terminal caret, rows that light up as you move down
 * them — the identity carries in the layout (the `dl`/`dt`/`dd` key-value
 * rows, the `$` prompts, the scanline field) as much as in the type, which
 * is why respecting the owner's own font choice (Phase 5A) doesn't cost it
 * anything: it still reads as a terminal in Serif.
 */
export default function MonoCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#0C0C0C");
  const { accent, accentText: ink } = theme;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      {/* Faint scanline field — CRT texture, not a pattern you consciously see. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />
      <main className="relative mx-auto w-full max-w-md px-6 pt-20 pb-32">
        <div className="card-rise flex items-start gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded border"
            style={{
              borderColor: `${accent}44`,
              background: `linear-gradient(140deg, ${accent}1A, transparent)`,
            }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[13px] font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold tracking-tight" style={{ color: theme.fg }}>
              {card.full_name}
              <span className="caret-blink ml-1 font-normal" style={{ color: ink }}>
                _
              </span>
            </h1>
            <p className="mt-0.5 text-[11px]" style={{ color: theme.fgMuted }}>@{card.username}</p>
          </div>
        </div>

        <dl className="mt-8 space-y-1.5 text-[11px]">
          {card.headline && (
            <div className="card-rise flex gap-3" style={{ ["--d" as string]: "90ms" }}>
              <dt className="w-20 shrink-0" style={{ color: theme.fgMuted }}>role</dt>
              <dd style={{ color: ink }}>{card.headline}</dd>
            </div>
          )}
          {card.company && (
            <div className="card-rise flex gap-3" style={{ ["--d" as string]: "130ms" }}>
              <dt className="w-20 shrink-0" style={{ color: theme.fgMuted }}>org</dt>
              <dd style={{ color: theme.fgDim }}>{card.company}</dd>
            </div>
          )}
          {card.location && (
            <div className="card-location card-rise flex gap-3" style={{ ["--d" as string]: "170ms" }}>
              <dt className="w-20 shrink-0" style={{ color: theme.fgMuted }}>loc</dt>
              <dd style={{ color: theme.fgDim }}>{card.location}</dd>
            </div>
          )}
        </dl>

        {card.bio && (
          <p
            className="card-bio card-rise mt-6 border-l-2 pl-4 text-[13px] leading-relaxed"
            style={{ borderColor: `${accent}55`, color: theme.fgDim, ["--d" as string]: "210ms" }}
          >{card.bio}</p>
        )}

        <nav
          className="card-rise mt-8 divide-y overflow-hidden rounded border"
          style={{ borderColor: theme.border, ["--d" as string]: "260ms" }}
        >
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="group relative flex min-h-11 w-full items-center gap-3 px-4 text-[13px] transition-colors hover:[background:var(--row-hover)]"
                style={{ borderColor: theme.border, ["--row-hover" as string]: `${accent}14` }}
              >
                {/* Accent bar marks the active row. */}
                <span
                  className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
                  style={{ background: accent }}
                />
                {/* A prompt, not a bullet — the command-line treatment the
                    dl/dt rows above already set up. */}
                <span className="text-[13px] font-bold" style={{ color: theme.border }}>
                  &gt;
                </span>
                <Icon className="h-4 w-4" style={{ color: theme.fgMuted }} />
                <span
                  className="flex-1 transition-colors group-hover:[color:var(--row-fg)]"
                  style={{ color: theme.fgDim, ["--row-fg" as string]: theme.fg }}
                >
                  {button.label}
                </span>
                <span className="transition-all group-hover:translate-x-1" style={{ color: theme.fgMuted }}>
                  →
                </span>
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-6 inline-block text-[11px] transition-colors hover:[color:var(--hover-fg)]"
          style={{ color: theme.fgMuted, ["--hover-fg" as string]: theme.fgDim, ["--d" as string]: "320ms" }}
        >
          <span style={{ color: ink }}>$</span> save-contact
        </SaveContact>
      </main>
    </div>
  );
}
