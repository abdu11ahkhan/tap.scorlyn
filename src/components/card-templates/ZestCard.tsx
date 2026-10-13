import { BUTTON_KIND_GROUPS, fontStack, initialsOf, resolveCardTheme, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";

const SOCIAL = new Set(BUTTON_KIND_GROUPS.find((g) => g.label === "Social")?.kinds ?? []);

/**
 * Bright small-business page: a full yellow ground, an optional rounded
 * cover photo up top, a round logo, a short pitch, and confident black pill
 * buttons. Social links drop to a row of round icons at the foot so the
 * main actions stay uncluttered.
 */
export default function ZestCard({ card, buttons }: { card: CardProfile; buttons: ResolvedButton[] }) {
  const theme = resolveCardTheme(card, "#FFD43B");
  const pill = theme.accent;
  const pillText = theme.onAccent;
  const socials = buttons.filter((b) => SOCIAL.has(b.kind));
  const main = buttons.filter((b) => !SOCIAL.has(b.kind));
  const list = main.length ? main : buttons;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={theme.accent} />
      <main className="relative mx-auto flex w-full max-w-sm flex-col items-center px-6 pb-28 pt-8 text-center">
        {card.cover_url && (
          <div className="card-rise mb-[-44px] h-48 w-full overflow-hidden rounded-[28px] border-[3px]" style={{ borderColor: pill, ["--d" as string]: "0ms" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.cover_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div
          className={`card-avatar card-rise relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] ${card.cover_url ? "" : "mt-10"}`}
          style={{ background: pill, borderColor: theme.surface, ["--d" as string]: "50ms" }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[28px] font-black" style={{ color: theme.surface }}>
              {initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1 className="card-rise line-clamp-3 [overflow-wrap:anywhere] [text-wrap:balance] mt-4 text-[26px] font-black leading-tight tracking-tight" style={{ ["--d" as string]: "90ms" }}>
          {card.full_name}
        </h1>
        <p className="card-rise mt-0.5 text-[13px] font-semibold" style={{ color: theme.fgDim, ["--d" as string]: "120ms" }}>
          @{card.username}
        </p>
        {(card.bio || card.headline) && (
          <p className="card-rise line-clamp-4 [overflow-wrap:anywhere] [text-wrap:balance] mt-3 max-w-xs text-[14.5px] font-medium leading-relaxed" style={{ ["--d" as string]: "150ms" }}>
            {card.bio || card.headline}
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
                className="card-rise flex min-h-[54px] w-full items-center justify-center rounded-full px-6 text-[14px] font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
                style={{ background: pill, color: pillText, ["--d" as string]: `${190 + i * 45}ms` }}
              >
                <span className="truncate">{b.label}</span>
              </a>
            ))}
          </nav>
        )}

        {socials.length > 0 && main.length > 0 && (
          <div className="card-rise mt-7 flex flex-wrap items-center justify-center gap-2.5" style={{ ["--d" as string]: `${220 + list.length * 45}ms` }}>
            {socials.map((s, i) => {
              const Icon = iconFor(s.kind);
              return (
                <a
                  key={`${s.href}-${i}`}
                  href={s.href}
                  target={s.external ? "_blank" : undefined}
                  rel={s.external ? "noopener noreferrer" : undefined}
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: pill, color: pill }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
