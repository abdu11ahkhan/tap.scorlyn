import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { fontStack, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * LANDING — "coming soon", with a sign-up as the only real action.
 *
 * The form posts to the owner's own mailto: so it works with no backend at
 * all. If they haven't set an email, the CTA falls back to their first button.
 */
export default function WaitlistCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#08060F");
  const { accent } = theme;
  const email = card.email?.trim();
  const fallback = buttons[0];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <div
        className="gradient-pan pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `radial-gradient(at 20% 0%, ${accent}AA 0px, transparent 55%), radial-gradient(at 90% 100%, ${accent}66 0px, transparent 55%)`,
        }}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-20">
        <div className="card-rise" style={{ ["--d" as string]: "0ms" }}>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-widest backdrop-blur-xl"
            style={{ borderColor: theme.border }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            coming soon
          </span>
        </div>

        <h1
          className="card-headline card-rise mt-7 text-[48px] font-black leading-[0.9] tracking-tighter"
          style={{ ["--d" as string]: "70ms" }}
        >{card.headline || card.full_name}</h1>

        {card.bio && (
          <p
            className="card-bio card-rise mt-5 text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "130ms" }}
          >{card.bio}</p>
        )}

        {/* No backend: a GET mailto form still opens a pre-addressed email. */}
        {email ? (
          <form
            action={`mailto:${email}`}
            method="get"
            className="card-rise mt-9"
            style={{ ["--d" as string]: "190ms" }}
          >
            <input type="hidden" name="subject" value="Add me to the waitlist" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: theme.fgMuted }}
                />
                <input
                  type="email"
                  name="body"
                  required
                  placeholder="you@example.com"
                  aria-label="Your email"
                  className="h-14 w-full rounded-full border pl-11 pr-4 text-[15px] font-semibold outline-none backdrop-blur-xl"
                  style={{ borderColor: theme.border, color: theme.fg }}
                />
              </div>
              <button
                type="submit"
                className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-black uppercase tracking-tight transition-transform active:scale-95"
                style={{ background: accent, color: theme.onAccent }}
              >
                join
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {/* Real reassurance, not a fabricated headcount — nothing here
                tracks who else has signed up. */}
            <p
              className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: theme.fgMuted }}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Goes straight to {card.full_name.split(" ")[0]} — no spam, no list sold on.
            </p>
          </form>
        ) : (
          fallback && (
            <a
              href={fallback.href}
              target={fallback.external ? "_blank" : undefined}
              rel={fallback.external ? "noopener noreferrer" : undefined}
              className="card-rise mt-9 inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-[15px] font-black uppercase tracking-tight"
              style={{ background: accent, color: theme.onAccent, ["--d" as string]: "190ms" }}
            >
              {fallback.label}
              <ArrowRight className="h-4 w-4" />
            </a>
          )
        )}

        <div className="my-8 h-px w-full" style={{ background: theme.border }} />

        <p
          className="text-[11px] font-black uppercase tracking-[0.25em]"
          style={{ color: theme.fgMuted }}
        >
          find me elsewhere
        </p>

        <div
          className="card-rise mt-4 flex flex-wrap items-center gap-3"
          style={{ ["--d" as string]: "250ms" }}
        >
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            return (
              <a
                key={`${button.href}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                title={button.label}
                aria-label={button.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-colors"
                style={{ borderColor: theme.border, color: theme.fgDim }}
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            );
          })}
        </div>

        <p className="mt-12 text-[11px] font-bold" style={{ color: theme.fgMuted }}>
          {card.full_name}
          {card.company ? ` · ${card.company}` : ""}
        </p>
      </main>
    </div>
  );
}
