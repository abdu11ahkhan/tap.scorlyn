import { ArrowRight, Check } from "lucide-react";
import {
  fontStack,
  initialsOf,
  readableOn,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * LANDING — one promise, one button.
 *
 * Same data as a profile card, read differently: headline becomes the pitch,
 * the first button becomes the single CTA, the rest become supporting proof.
 */
export default function PitchCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#CCFF00";
  const onAccent = readableOn(accent);

  const [primary, ...rest] = buttons;

  return (
    <div
      className="min-h-screen bg-ink text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 text-center">
        {/* Kept low: a bright accent at 30% over ink washes the whole hero
            into a muddy tint rather than reading as a glow. */}
        <div
          className="float-orb pointer-events-none absolute -top-40 left-1/2 h-[340px] w-[420px] -translate-x-1/2 rounded-full opacity-[0.18] blur-[110px]"
          style={{ background: accent }}
        />

        <div className="relative mx-auto max-w-sm">
          <span
            className="card-rise inline-block rounded-full border-2 border-ink px-4 py-1.5 text-[11px] font-black uppercase tracking-widest"
            style={{ background: accent, color: onAccent, ["--d" as string]: "0ms" }}
          >
            {card.company || card.location || "now live"}
          </span>

          <h1
            className="card-rise mt-6 text-[2.9rem] font-black leading-[0.92] tracking-tighter"
            style={{ ["--d" as string]: "70ms" }}
          >
            {card.headline || card.full_name}
          </h1>

          {card.bio && (
            <p
              className="card-rise mt-5 text-[15px] font-medium leading-relaxed text-white/60"
              style={{ ["--d" as string]: "130ms" }}
            >
              {card.bio}
            </p>
          )}

          {primary && (
            <a
              href={primary.href}
              target={primary.external ? "_blank" : undefined}
              rel={primary.external ? "noopener noreferrer" : undefined}
              className="card-rise sticker-lg sticker-press mt-8 inline-flex h-16 w-full items-center justify-center gap-2 rounded-full border-2 border-ink text-lg font-black uppercase tracking-tight"
              style={{
                background: accent,
                color: onAccent,
                ["--d" as string]: "190ms",
              }}
            >
              {primary.label}
              <ArrowRight className="h-5 w-5" />
            </a>
          )}

          {/* Author line with a face — a bare "by name" left the hero floating. */}
          <div
            className="card-rise mt-6 flex items-center justify-center gap-3"
            style={{ ["--d" as string]: "240ms" }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-9 w-9 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-black"
                style={{ background: accent, color: onAccent }}
              >
                {initialsOf(card.full_name)}
              </span>
            )}
            <span className="text-left">
              <span className="block text-[13px] font-black leading-tight">
                {card.full_name}
              </span>
              {card.location && (
                <span className="block text-[11px] font-semibold text-white/40">
                  {card.location}
                </span>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Proof strip — three numbers give the page a spine. */}
      <section className="border-y-2 border-white/10 px-6 py-7">
        <div className="mx-auto grid max-w-sm grid-cols-3 divide-x divide-white/10 text-center">
          {[
            { value: `${buttons.length}`, label: "ways to reach me" },
            { value: "1", label: "tap to open" },
            { value: "0", label: "apps needed" },
          ].map((stat) => (
            <div key={stat.label} className="px-2">
              <p className="text-3xl font-black tracking-tighter" style={{ color: accent }}>
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase leading-tight tracking-widest text-white/35">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Supporting links, read as proof points */}
      {rest.length > 0 && (
        <section className="px-6 py-12">
          <p className="mx-auto mb-4 max-w-sm text-[11px] font-black uppercase tracking-[0.25em] text-white/30">
            also here
          </p>
          <div className="mx-auto max-w-sm space-y-3">
            {rest.map((button, index) => {
              const Icon = iconFor(button.kind);
              return (
                <a
                  key={`${button.href}-${index}`}
                  href={button.href}
                  target={button.external ? "_blank" : undefined}
                  rel={button.external ? "noopener noreferrer" : undefined}
                  className="card-rise group flex items-center gap-3 rounded-2xl border-2 border-white/12 bg-white/[0.03] px-5 py-4 text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:border-white/30"
                  style={{ ["--d" as string]: `${index * 60}ms` }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${accent}22`, color: accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{button.label}</span>
                  <Check className="h-4 w-4 opacity-30" strokeWidth={3} />
                </a>
              );
            })}
          </div>
        </section>
      )}

      <footer className="px-6 pb-20 pt-4 text-center">
        <a
          href={`/api/vcard/${card.username}`}
          className="text-xs font-black uppercase tracking-widest text-white/30 hover:text-white"
        >
          save to contacts
        </a>
      </footer>
    </div>
  );
}
