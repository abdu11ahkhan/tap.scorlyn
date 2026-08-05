import { ArrowUpRight, MapPin } from "lucide-react";
import { fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * PORTFOLIO — big imagery energy.
 *
 * A full-bleed cover built from the avatar, then each link as a wide captioned
 * plate. For photographers and anyone whose work is visual.
 */
export default function ShowcaseCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#F43F5E";

  return (
    <div
      className="min-h-screen bg-[#0C0A0B] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Cover */}
      <section className="relative h-[58vh] min-h-[380px] overflow-hidden">
        {/* Prefer a dedicated cover; fall back to the avatar. */}
        {card.cover_url || card.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.cover_url || card.avatar_url || ""}
            alt={card.full_name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="gradient-pan absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(at 25% 25%, ${accent} 0px, transparent 60%), radial-gradient(at 75% 75%, ${accent}88 0px, transparent 60%)`,
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-8xl font-black text-white/15">
              {initialsOf(card.full_name)}
            </span>
          </div>
        )}

        {/* Legibility scrim under the caption */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A0B] via-[#0C0A0B]/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-6 pb-8">
          <h1
            className="card-rise text-[2.6rem] font-black leading-[0.92] tracking-tighter"
            style={{ ["--d" as string]: "0ms" }}
          >
            {card.full_name}
          </h1>
          {card.headline && (
            <p
              className="card-rise mt-2 text-sm font-black uppercase tracking-[0.2em]"
              style={{ color: accent, ["--d" as string]: "70ms" }}
            >
              {card.headline}
            </p>
          )}
          <div
            className="card-rise mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-white/50"
            style={{ ["--d" as string]: "110ms" }}
          >
            {card.company && <span>{card.company}</span>}
            {card.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {card.location}
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-8">
        {card.bio && (
          <p
            className="card-rise text-[15px] leading-relaxed text-white/65"
            style={{ ["--d" as string]: "150ms" }}
          >
            {card.bio}
          </p>
        )}

        <div className="mt-9 space-y-3">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30"
                style={{ ["--d" as string]: `${190 + index * 60}ms` }}
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${accent}26`, color: accent }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-black tracking-tight">
                    {button.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-widest text-white/35">
                    {String(index + 1).padStart(2, "0")} · view
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            );
          })}
        </div>

        <a
          href={`/api/vcard/${card.username}`}
          className="card-rise mt-9 block text-center text-[11px] font-black uppercase tracking-[0.25em] text-white/30 hover:text-white"
          style={{ ["--d" as string]: `${230 + buttons.length * 60}ms` }}
        >
          save to contacts
        </a>
      </main>
    </div>
  );
}
