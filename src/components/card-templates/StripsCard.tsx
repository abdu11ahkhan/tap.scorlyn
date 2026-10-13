import { BUTTON_KIND_GROUPS, fontStack, resolveCardTheme, resolveGallery, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import { iconFor } from "./button-icons";
import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";

const SOCIAL = new Set(BUTTON_KIND_GROUPS.find((g) => g.label === "Social")?.kinds ?? []);

/**
 * Editorial lifestyle page: a big lowercase name on warm paper, a quiet
 * caps line, a row of small social icons, then every link as a full-width
 * photo strip with its name laid over it — the blogger / creator look.
 *
 * Strip photos come from the card's gallery in order (then the cover), so
 * the owner controls them from the Photos section. With no photos the strips
 * fall back to soft tones of their own colour, never a broken image.
 */
export default function StripsCard({ card, buttons }: { card: CardProfile; buttons: ResolvedButton[] }) {
  const theme = resolveCardTheme(card, "#F4EEE6");
  const role = roleLine(card);
  const socials = buttons.filter((b) => SOCIAL.has(b.kind) || b.kind === "email");
  const strips = buttons.filter((b) => !SOCIAL.has(b.kind) && b.kind !== "email");
  const list = strips.length ? strips : buttons;
  const photos = [...resolveGallery(card.gallery).map((g) => g.url), ...(card.cover_url ? [card.cover_url] : [])];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={theme.accent} />
      <main className="relative mx-auto w-full max-w-sm pb-28 pt-16">
        <header className="px-6 text-center">
          <h1
            className="card-rise line-clamp-3 [overflow-wrap:anywhere] [text-wrap:balance] text-[40px] font-extrabold lowercase leading-[0.95] tracking-[-0.03em]"
            style={{ ["--d" as string]: "0ms" }}
          >
            {card.full_name}
          </h1>
          {role && (
            <p
              className="card-rise line-clamp-2 [overflow-wrap:anywhere] [text-wrap:balance] mt-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.fgDim, ["--d" as string]: "60ms" }}
            >
              {role}
            </p>
          )}
          {socials.length > 0 && (
            <div className="card-rise mt-4 flex items-center justify-center gap-3" style={{ ["--d" as string]: "110ms" }}>
              {socials.map((s, i) => {
                const Icon = iconFor(s.kind);
                return (
                  <a
                    key={`${s.href}-${i}`}
                    href={s.href}
                    target={s.external ? "_blank" : undefined}
                    rel={s.external ? "noopener noreferrer" : undefined}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ color: theme.fgDim }}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}
          {card.bio && (
            <p className="card-rise line-clamp-4 [overflow-wrap:anywhere] [text-wrap:balance] mx-auto mt-4 max-w-xs text-[14px] leading-relaxed" style={{ color: theme.fgDim, ["--d" as string]: "140ms" }}>
              {card.bio}
            </p>
          )}
        </header>

        {hasButtonOverride(card) ? (
          <div className="px-6">
            <LinkButtons card={card} buttons={list} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
          </div>
        ) : (
          <nav className="mt-8 flex flex-col gap-[3px]">
            {list.map((b, i) => {
              const photo = photos.length ? photos[i % photos.length] : null;
              return (
                <a
                  key={`${b.href}-${i}`}
                  href={b.href}
                  target={b.external ? "_blank" : undefined}
                  rel={b.external ? "noopener noreferrer" : undefined}
                  className="card-rise group relative flex h-[92px] items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(120deg, ${theme.accent}, ${theme.accent}99)`,
                    ["--d" as string]: `${180 + i * 50}ms`,
                  }}
                >
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ objectPosition: `50% ${20 + ((i * 23) % 60)}%` }}
                    />
                  )}
                  <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                  <span className="relative px-6 text-center text-[18px] font-bold lowercase tracking-wide text-white drop-shadow">
                    {b.label}
                  </span>
                </a>
              );
            })}
          </nav>
        )}

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.fgMuted }}>
          @{card.username}
        </p>
      </main>
    </div>
  );
}
