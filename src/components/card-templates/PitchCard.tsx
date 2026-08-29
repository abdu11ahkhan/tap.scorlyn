import { ArrowRight, Check } from "lucide-react";
import {
  fontStack,
  initialsOf,
  resolveCardTheme,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
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
  const theme = resolveCardTheme(card, "#0A0A0A");
  const { accent, accentText: ink, onAccent } = theme;

  const [primary, ...rest] = buttons;

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
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
            className="card-company card-rise inline-block rounded-full border-2 border-ink px-4 py-1.5 text-[11px] font-black uppercase tracking-widest"
            style={{ background: accent, color: onAccent, ["--d" as string]: "0ms" }}
          >{card.company || card.location || "now live"}</span>

          <h1
            className="card-headline card-rise mt-6 text-[2.9rem] font-black leading-[0.9] tracking-tighter"
            style={{ ["--d" as string]: "70ms" }}
          >{card.headline || card.full_name}</h1>

          {card.bio && (
            <p
              className="card-bio card-rise mt-5 text-[15px] font-medium leading-relaxed"
              style={{ color: theme.fgDim, ["--d" as string]: "130ms" }}
            >{card.bio}</p>
          )}

          {primary && (
            <a
              href={primary.href}
              target={primary.external ? "_blank" : undefined}
              rel={primary.external ? "noopener noreferrer" : undefined}
              className="card-rise sticker-lg sticker-press mt-8 inline-flex h-16 w-full items-center justify-center gap-2 rounded-full border-2 border-ink text-[18px] font-black uppercase tracking-tight"
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
                className="card-avatar h-16 w-16 rounded-full border-2 object-cover"
                style={{ borderColor: theme.border }}
              />
            ) : (
              <span
                className="card-avatar flex h-16 w-16 items-center justify-center rounded-full text-[11px] font-black"
                style={{ background: accent, color: onAccent }}
              >
                {initialsOf(card.full_name)}
              </span>
            )}
            <span className="text-left">
              <span className="card-name block text-[13px] font-black leading-tight">{card.full_name}</span>
              {card.location && (
                <span className="card-location block text-[11px] font-semibold" style={{ color: theme.fgMuted }}>{card.location}</span>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Proof strip — three numbers give the page a spine. */}
      <section className="border-y-2 px-6 py-7" style={{ borderColor: theme.border }}>
        <div className="mx-auto grid max-w-sm grid-cols-3 text-center">
          {[
            { value: `${buttons.length}`, label: "ways to reach me" },
            { value: "1", label: "tap to open" },
            { value: "0", label: "apps needed" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="px-2"
              style={i > 0 ? { borderLeft: `1px solid ${theme.border}` } : undefined}
            >
              <p className="text-[30px] font-black tracking-tighter" style={{ color: ink }}>
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] font-black uppercase leading-tight tracking-widest" style={{ color: theme.fgMuted }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Supporting links, read as proof points */}
      {rest.length > 0 && (
        <section className="px-6 py-12">
          <p className="mx-auto mb-4 max-w-sm text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
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
                  className="card-rise group flex items-center gap-3 rounded-2xl border-2 bg-white/[0.03] px-5 py-4 text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:[border-color:var(--border-hover)]"
                  style={{
                    borderColor: theme.border,
                    ["--border-hover" as string]: theme.fgMuted,
                    ["--d" as string]: `${index * 60}ms`,
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${accent}22`, color: ink }}
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
        <SaveContact
          card={card}
          className="flex min-h-12 items-center justify-center rounded-lg border text-[12px] font-black uppercase tracking-widest"
          style={{ borderColor: theme.fgMuted, color: theme.fg }}
        >
          save to contacts
        </SaveContact>
      </footer>
    </div>
  );
}
