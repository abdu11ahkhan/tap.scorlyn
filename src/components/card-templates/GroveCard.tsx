import { BUTTON_KIND_GROUPS, fontStack, initialsOf, mixHex, resolveCardTheme, resolveGallery, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";

const SOCIAL = new Set(BUTTON_KIND_GROUPS.find((g) => g.label === "Social")?.kinds ?? []);

/**
 * Calm brand page for a café, shop or small label: a muted sage ground, a
 * round logo badge, soft pale pill buttons, a row of social icons, and a
 * product photo settling in at the foot of the page.
 *
 * The foot photo is the cover (or the first gallery photo); without one the
 * page simply ends after the icons.
 */
export default function GroveCard({ card, buttons }: { card: CardProfile; buttons: ResolvedButton[] }) {
  const theme = resolveCardTheme(card, "#6E7B63");
  // On the native sage, white text like the reference design; on a ground
  // the owner picked, whatever reads best on it.
  const ink = card.surface_color?.trim() ? theme.fg : "#ffffff";
  const inkDim = card.surface_color?.trim() ? theme.fgDim : "rgba(255,255,255,0.82)";
  const pillBg = mixHex(theme.surface, "#ffffff", 0.7);
  const pillText = mixHex(theme.surface, "#111111", 0.75);
  const socials = buttons.filter((b) => SOCIAL.has(b.kind));
  const main = buttons.filter((b) => !SOCIAL.has(b.kind));
  const list = main.length ? main : buttons;
  const foot = card.cover_url || resolveGallery(card.gallery)[0]?.url || null;

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: theme.surface, color: ink, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={theme.accent} />
      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center px-6 pt-14 text-center">
        <div
          className="card-avatar card-rise flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full"
          style={{ background: theme.accent, ["--d" as string]: "0ms" }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-serif text-[26px] font-bold italic" style={{ color: "#F2A35E" }}>
              {card.full_name.split(" ")[0] || initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1 className="card-rise line-clamp-3 [overflow-wrap:anywhere] [text-wrap:balance] mt-5 text-[21px] font-semibold leading-tight" style={{ ["--d" as string]: "60ms" }}>
          {card.full_name}
        </h1>
        {(card.headline || card.bio) && (
          <p className="card-rise line-clamp-2 [overflow-wrap:anywhere] [text-wrap:balance] mt-1.5 max-w-xs text-[14px] leading-relaxed" style={{ color: inkDim, ["--d" as string]: "100ms" }}>
            {card.headline || card.bio}
          </p>
        )}
        {card.headline && card.bio && (
          <p className="card-rise line-clamp-4 [overflow-wrap:anywhere] [text-wrap:balance] mt-2 max-w-xs text-[13px] leading-relaxed" style={{ color: inkDim, ["--d" as string]: "130ms" }}>
            {card.bio}
          </p>
        )}

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={list} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
        ) : (
          <nav className="mt-7 w-full space-y-3">
            {list.map((b, i) => (
              <a
                key={`${b.href}-${i}`}
                href={b.href}
                target={b.external ? "_blank" : undefined}
                rel={b.external ? "noopener noreferrer" : undefined}
                className="card-rise flex min-h-[52px] w-full items-center justify-center rounded-full px-6 text-[14.5px] font-medium transition-colors hover:brightness-105"
                style={{ background: pillBg, color: pillText, ["--d" as string]: `${170 + i * 45}ms` }}
              >
                <span className="truncate">{b.label}</span>
              </a>
            ))}
          </nav>
        )}

        {socials.length > 0 && main.length > 0 && (
          <div className="card-rise mt-6 flex flex-wrap items-center justify-center gap-5" style={{ ["--d" as string]: `${200 + list.length * 45}ms` }}>
            {socials.map((s, i) => {
              const Icon = iconFor(s.kind);
              return (
                <a
                  key={`${s.href}-${i}`}
                  href={s.href}
                  target={s.external ? "_blank" : undefined}
                  rel={s.external ? "noopener noreferrer" : undefined}
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-75"
                  style={{ color: ink }}
                >
                  <Icon className="h-6 w-6" />
                </a>
              );
            })}
          </div>
        )}

        <div className={foot ? "h-8" : "h-28"} />
      </main>

      {foot && (
        <div className="relative mx-auto -mt-4 h-60 w-full max-w-md shrink-0 pb-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foot} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 h-24" style={{ background: `linear-gradient(${theme.surface}, transparent)` }} />
        </div>
      )}
    </div>
  );
}
