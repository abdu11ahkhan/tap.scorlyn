import { accentOn, fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Monospace, everything on a grid, with a live terminal caret. Understated but
 * not inert — rows light up in the accent as you move down them.
 */
export default function MonoCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#22D3EE";
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "dark");

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0C0C0C] text-neutral-200"
      style={{ fontFamily: fontStack("mono") }}
    >
      {/* Faint scanline field — CRT texture, not a pattern you consciously see. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div
        className="float-orb pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full blur-[110px] opacity-20"
        style={{ background: accent }}
      />

      <main className="relative mx-auto w-full max-w-md px-6 pt-20 pb-32">
        <div className="card-rise flex items-start gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border"
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
              <span className="text-sm font-bold" style={{ color: ink }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-white">
              {card.full_name}
              <span className="caret-blink ml-1 font-normal" style={{ color: ink }}>
                _
              </span>
            </h1>
            <p className="mt-0.5 text-xs text-neutral-500">@{card.username}</p>
          </div>
        </div>

        <dl className="mt-8 space-y-1.5 text-xs">
          {card.headline && (
            <div className="card-rise flex gap-3" style={{ ["--d" as string]: "90ms" }}>
              <dt className="w-20 shrink-0 text-neutral-600">role</dt>
              <dd style={{ color: ink }}>{card.headline}</dd>
            </div>
          )}
          {card.company && (
            <div className="card-rise flex gap-3" style={{ ["--d" as string]: "130ms" }}>
              <dt className="w-20 shrink-0 text-neutral-600">org</dt>
              <dd className="text-neutral-300">{card.company}</dd>
            </div>
          )}
          {card.location && (
            <div className="card-rise flex gap-3" style={{ ["--d" as string]: "170ms" }}>
              <dt className="w-20 shrink-0 text-neutral-600">loc</dt>
              <dd className="text-neutral-300">{card.location}</dd>
            </div>
          )}
        </dl>

        {card.bio && (
          <p
            className="card-rise mt-6 border-l-2 pl-4 text-[13px] leading-relaxed text-neutral-400"
            style={{ borderColor: `${accent}55`, ["--d" as string]: "210ms" }}
          >
            {card.bio}
          </p>
        )}

        <nav
          className="card-rise mt-8 divide-y divide-neutral-800 overflow-hidden rounded border border-neutral-800"
          style={{ ["--d" as string]: "260ms" }}
        >
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="group relative flex w-full items-center gap-3 bg-neutral-950 px-4 py-3.5 text-[13px] transition-colors hover:bg-neutral-900"
              >
                {/* Accent bar marks the active row. */}
                <span
                  className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
                  style={{ background: accent }}
                />
                <Icon className="h-4 w-4 text-neutral-600 transition-colors group-hover:[color:currentColor]" />
                <span className="flex-1 text-neutral-300 transition-colors group-hover:text-white">
                  {button.label}
                </span>
                <span
                  className="text-neutral-700 transition-all group-hover:translate-x-1"
                  style={{ color: undefined }}
                >
                  →
                </span>
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-6 inline-block text-[11px] text-neutral-600 transition-colors hover:text-neutral-300"
          style={{ ["--d" as string]: "320ms" }}
        >
          <span style={{ color: ink }}>$</span> save-contact
        </SaveContact>
      </main>
    </div>
  );
}
