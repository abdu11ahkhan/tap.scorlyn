import { Globe, MapPin, Phone } from "lucide-react";
import {
  fontStack,
  initialsOf,
  mixHex,
  resolveCardTheme,
  resolveReviewConfig,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import BackgroundEffect from "./BackgroundEffect";
import ReviewFlow from "./ReviewFlow";

/**
 * REVIEWS — the page a review card on a counter or table opens. One job:
 * get an honest rating in a single tap. Business identity at the top so the
 * customer knows whose card this is, then the stars, and nothing else
 * competing with them. Links, bio extras and the save-contact dock are left
 * out on purpose; a review card isn't a business card.
 */
export default function ReviewCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#F6F4F0");
  const config = resolveReviewConfig(card.review_config);
  const logo = card.logo_url || card.avatar_url;
  const phone = buttons.find((b) => b.kind === "phone");
  const website = buttons.find((b) => b.kind === "link" && !/review/i.test(b.label));
  const panel = theme.dark ? mixHex(theme.surface, "#ffffff", 0.07) : "#ffffff";

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={theme.accent} />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
        <header className="card-rise text-center" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border shadow-[0_8px_30px_-10px_rgba(0,0,0,0.25)]"
            style={{ background: "#ffffff", borderColor: theme.border }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={`${card.full_name} logo`} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-[28px] font-semibold" style={{ color: theme.accentText }}>
                {initialsOf(card.full_name)}
              </span>
            )}
          </div>

          <h1 className="card-name mt-5 text-[26px] font-semibold leading-tight tracking-tight" style={{ minHeight: 0 }}>
            {card.full_name}
          </h1>
          {card.headline && (
            <p
              className="card-headline mt-1.5 text-[12px] font-medium uppercase tracking-[0.18em]"
              style={{ color: theme.accentText, minHeight: 0 }}
            >
              {card.headline}
            </p>
          )}
          {card.bio && (
            <p
              className="card-bio mx-auto mt-3 max-w-xs text-[14px] leading-relaxed"
              style={{ color: theme.fgDim, minHeight: 0 }}
            >
              {card.bio}
            </p>
          )}

          {(card.location || phone || website) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px]" style={{ color: theme.fgMuted }}>
              {card.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {card.location}
                </span>
              )}
              {phone && (
                <a href={phone.href} className="inline-flex min-h-11 items-center gap-1 underline-offset-2 hover:underline">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  Call
                </a>
              )}
              {website && (
                <a
                  href={website.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 underline-offset-2 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {website.label || "Website"}
                </a>
              )}
            </div>
          )}
        </header>

        <section className="card-rise mt-8" style={{ ["--d" as string]: "120ms" }}>
          <ReviewFlow
            username={card.username}
            businessName={card.full_name}
            config={config}
            colors={{
              fg: theme.fg,
              fgDim: theme.fgDim,
              fgMuted: theme.fgMuted,
              border: theme.border,
              accent: theme.accent,
              onAccent: theme.onAccent,
              panel,
              field: theme.dark ? mixHex(panel, "#ffffff", 0.04) : "#FAFAF9",
            }}
          />
        </section>

        <p className="mt-auto pt-10 text-center text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: theme.fgMuted }}>
          Powered by ScorlynTap
        </p>
      </main>
    </div>
  );
}
