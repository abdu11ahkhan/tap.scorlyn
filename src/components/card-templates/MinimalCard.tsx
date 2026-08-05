import { ArrowUpRight, Download, MapPin } from "lucide-react";
import { fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * Carrd's house style: centred, one accent colour, a lot of air.
 * The restraint stays; the life comes from a soft accent wash, a pulsing ring
 * on the avatar, and buttons that fill with the accent on touch.
 */
export default function MinimalCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#111111";

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white text-neutral-900"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Accent wash — barely there, but it stops the page reading as a blank sheet. */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[520px] -translate-x-1/2 rounded-full blur-[110px] opacity-[0.18] float-orb"
        style={{ background: accent }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-[-120px] h-[320px] w-[320px] rounded-full blur-[110px] opacity-[0.12] float-orb"
        style={{ background: accent, ["--d" as string]: "3s" }}
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-col items-center px-6 pt-24 pb-32 text-center">
        <div className="card-rise relative" style={{ ["--d" as string]: "0ms" }}>
          {/* Soft pulse outward — reads as "this card is live". */}
          <span
            className="pulse-ring absolute inset-0 rounded-full border"
            style={{ borderColor: accent }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-2 ring-offset-4 ring-offset-white"
            style={{
              background: `linear-gradient(140deg, ${accent}1F, ${accent}08)`,
              ["--tw-ring-color" as string]: `${accent}55`,
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
              <span className="text-2xl font-light tracking-wide" style={{ color: accent }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>
        </div>

        <h1
          className="card-rise mt-8 text-[28px] font-light leading-tight tracking-tight"
          style={{ ["--d" as string]: "80ms" }}
        >
          {card.full_name}
        </h1>

        {card.headline && (
          <p
            className="card-rise mt-2 text-sm uppercase tracking-[0.18em]"
            style={{ color: accent, ["--d" as string]: "140ms" }}
          >
            {card.headline}
          </p>
        )}

        {card.company && (
          <p
            className="card-rise mt-1.5 text-sm text-neutral-500"
            style={{ ["--d" as string]: "180ms" }}
          >
            {card.company}
          </p>
        )}

        {card.location && (
          <p
            className="card-rise mt-3 flex items-center gap-1.5 text-xs text-neutral-400"
            style={{ ["--d" as string]: "220ms" }}
          >
            <MapPin className="h-3.5 w-3.5" />
            {card.location}
          </p>
        )}

        {card.bio && (
          <p
            className="card-rise mt-6 text-[15px] leading-relaxed text-neutral-600"
            style={{ ["--d" as string]: "260ms" }}
          >
            {card.bio}
          </p>
        )}

        {/* A live status line and a rule — the page was mostly whitespace
            between the bio and the buttons, which read as unfinished. */}
        <div
          className="card-rise mt-7 flex w-full items-center gap-3"
          style={{ ["--d" as string]: "280ms" }}
        >
          <span className="h-px flex-1 bg-neutral-200" />
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            <span className="relative flex h-2 w-2">
              <span
                className="pulse-ring absolute inline-flex h-full w-full rounded-full"
                style={{ background: accent }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: accent }}
              />
            </span>
            available now
          </span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <nav className="mt-10 w-full space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                // bg-white keeps the pill readable on top of the accent wash —
                // a bare border disappears against the tint.
                className="card-rise group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full border border-neutral-200/90 bg-white/80 py-3.5 text-sm font-medium shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg active:scale-[0.98]"
                style={{
                  ["--d" as string]: `${300 + index * 60}ms`,
                  ["--hover" as string]: accent,
                }}
              >
                {/* Accent fill sweeps up from the bottom on hover. */}
                <span
                  className="absolute inset-0 origin-bottom scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100"
                  style={{ background: `${accent}12` }}
                />
                <Icon
                  className="relative h-4 w-4 text-neutral-400 transition-colors group-hover:[color:var(--hover)]"
                  style={{}}
                />
                <span className="relative">{button.label}</span>
                <ArrowUpRight className="relative h-3.5 w-3.5 text-neutral-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </a>
            );
          })}
        </nav>

        <a
          href={`/api/vcard/${card.username}`}
          className="card-rise mt-7 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-5 py-2.5 text-xs font-semibold tracking-wide text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          style={{ ["--d" as string]: `${320 + buttons.length * 60}ms` }}
        >
          <Download className="h-3.5 w-3.5" />
          Save to contacts
        </a>

        <p
          className="card-rise mt-10 text-[10px] uppercase tracking-[0.3em] text-neutral-300"
          style={{ ["--d" as string]: `${360 + buttons.length * 60}ms` }}
        >
          @{card.username}
        </p>
      </main>
    </div>
  );
}
