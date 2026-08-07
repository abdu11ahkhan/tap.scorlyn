import { ArrowUpRight, MapPin } from "lucide-react";
import { accentOn, fontStack, initialsOf, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * Dark, frosted, lit by drifting accent orbs. Matches the marketing site's
 * look, so a card feels continuous with the brand.
 */
export default function GlassCard({
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
      className="relative min-h-screen overflow-hidden bg-[#05070C] text-white"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {/* Optional photo backdrop, heavily dimmed so the frosted panels and
          white text stay readable over whatever gets uploaded. */}
      {card.cover_url && (
        <div className="pointer-events-none fixed inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.cover_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[#05070C]/80" />
        </div>
      )}

      {/* Three orbs on different phases — the background never sits still. */}
      <div
        className="float-orb pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full blur-[130px] opacity-30"
        style={{ background: accent }}
      />
      <div
        className="float-orb pointer-events-none absolute bottom-10 -left-24 h-[320px] w-[320px] rounded-full blur-[120px] opacity-20"
        style={{ background: accent, ["--d" as string]: "3s" }}
      />
      <div
        className="float-orb pointer-events-none absolute top-1/3 -right-24 h-[280px] w-[280px] rounded-full blur-[120px] opacity-[0.16]"
        style={{ background: "#818CF8", ["--d" as string]: "6s" }}
      />

      <main className="relative mx-auto w-full max-w-sm px-5 pt-20 pb-32">
        <div
          className="card-rise card-shine relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          style={{ ["--d" as string]: "0ms" }}
        >
          <div className="relative mx-auto w-fit">
            <span
              className="pulse-ring absolute inset-0 rounded-2xl border"
              style={{ borderColor: accent }}
            />
            <div
              className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border"
              style={{
                borderColor: `${accent}55`,
                background: `linear-gradient(140deg, ${accent}26, transparent)`,
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
                <span className="text-2xl font-black text-white/80">
                  {initialsOf(card.full_name)}
                </span>
              )}
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight">{card.full_name}</h1>

          {card.headline && (
            <p
              className="mt-1.5 text-sm font-semibold"
              style={{ color: ink, textShadow: `0 0 22px ${accent}66` }}
            >
              {card.headline}
            </p>
          )}

          {card.company && <p className="mt-1 text-sm text-slate-400">{card.company}</p>}

          {card.location && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {card.location}
            </p>
          )}

          {card.bio && <p className="mt-5 text-sm leading-relaxed text-slate-300">{card.bio}</p>}
        </div>

        <nav className="mt-4 space-y-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className="card-rise group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[15px] font-semibold backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.99]"
                style={{ ["--d" as string]: `${120 + index * 60}ms` }}
              >
                {/* Accent bleeds in from the left edge on hover. */}
                <span
                  className="absolute inset-y-0 left-0 w-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: accent, boxShadow: `0 0 18px ${accent}` }}
                />
                <Icon
                  className="relative h-[18px] w-[18px] transition-transform group-hover:scale-110"
                  style={{ color: ink }}
                />
                <span className="relative flex-1">{button.label}</span>
                <ArrowUpRight className="relative h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="card-rise mt-6 block text-center text-xs text-slate-500 transition-colors hover:text-white"
          style={{ ["--d" as string]: `${160 + buttons.length * 60}ms` }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
