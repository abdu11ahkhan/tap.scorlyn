import { fontStack, initialsOf, resolveCardTheme, roleLine, type CardProfile, type ResolvedButton } from "@/lib/card";
import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";

/**
 * Playful creator page: an illustrated doodle wallpaper, a round photo with
 * a white ring, and every link as a chunky white pill in bold capitals.
 *
 * The wallpaper is drawn here as a repeating SVG tile tinted from the card's
 * own colours, so it never needs an upload. A cover photo, if set, replaces
 * it as the background.
 */
function doodleTile(ground: string, accent: string): string {
  const c = [accent, "#FF7AB6", "#FFD23F", "#3DDC97", "#4CC9F0"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <rect width="240" height="240" fill="${ground}"/>
  <g stroke="#2A1E3B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M38 30l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="${c[2]}"/>
    <circle cx="170" cy="46" r="20" fill="${c[1]}"/>
    <circle cx="164" cy="42" r="3" fill="#2A1E3B"/><circle cx="178" cy="42" r="3" fill="#2A1E3B"/>
    <path d="M162 53q8 7 16 0" fill="none"/>
    <path d="M24 150q16-22 32 0t32 0" fill="none" stroke="${c[0]}" stroke-width="7"/>
    <rect x="150" y="120" width="44" height="34" rx="9" fill="${c[3]}" transform="rotate(-12 172 137)"/>
    <path d="M110 205c-12-12-26-2-17 11l17 15 17-15c9-13-5-23-17-11z" fill="${c[1]}"/>
    <path d="M206 205l9 9m0-9l-9 9" stroke="${c[4]}" stroke-width="5"/>
    <circle cx="96" cy="96" r="9" fill="${c[4]}"/>
    <path d="M210 92v14m-7-7h14" stroke="${c[2]}" stroke-width="5"/>
    <path d="M50 215a14 14 0 1 1 28 0" fill="${c[0]}"/>
  </g>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function PopCard({ card, buttons }: { card: CardProfile; buttons: ResolvedButton[] }) {
  const theme = resolveCardTheme(card, "#C9A7F2");
  const role = roleLine(card);
  const wallpaper = card.cover_url
    ? `url("${card.cover_url}") center / cover no-repeat`
    : `${doodleTile(theme.surface, theme.accent)} 0 0 / 240px 240px repeat`;
  const display = 'var(--font-bebas), "Bebas Neue", Impact, "Arial Narrow", sans-serif';

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: wallpaper, backgroundColor: theme.surface, color: "#ffffff", fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={theme.accent} />
      <main className="relative mx-auto flex w-full max-w-sm flex-col items-center px-5 pb-28 pt-14 text-center">
        <div
          className="card-avatar card-rise flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-lg"
          style={{ background: theme.accent, ["--d" as string]: "0ms" }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[30px] text-white" style={{ fontFamily: display }}>
              {initialsOf(card.full_name)}
            </span>
          )}
        </div>

        <h1
          className="card-rise line-clamp-3 [overflow-wrap:anywhere] [text-wrap:balance] mt-4 text-[34px] uppercase leading-none tracking-wide"
          style={{ fontFamily: display, textShadow: "0 2px 0 #2A1E3B, 0 3px 10px rgba(0,0,0,.35)", ["--d" as string]: "60ms" }}
        >
          {card.full_name}
        </h1>
        {role && (
          <p
            className="card-rise line-clamp-2 [overflow-wrap:anywhere] [text-wrap:balance] mt-1.5 rounded-full bg-black/35 px-3 py-1 text-[12px] font-semibold"
            style={{ ["--d" as string]: "100ms" }}
          >
            {role}
          </p>
        )}
        {card.bio && (
          <p
            className="card-rise line-clamp-4 [overflow-wrap:anywhere] [text-wrap:balance] mt-3 max-w-xs rounded-2xl bg-black/30 px-4 py-2 text-[13.5px] leading-relaxed"
            style={{ ["--d" as string]: "140ms" }}
          >
            {card.bio}
          </p>
        )}

        {hasButtonOverride(card) ? (
          <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
        ) : (
          <nav className="mt-7 w-full space-y-3.5">
            {buttons.map((b, i) => (
              <a
                key={`${b.href}-${i}`}
                href={b.href}
                target={b.external ? "_blank" : undefined}
                rel={b.external ? "noopener noreferrer" : undefined}
                className="card-rise flex min-h-[58px] w-full items-center justify-center rounded-full bg-white px-6 text-[22px] uppercase leading-none tracking-wide text-[#1d1726] shadow-[0_5px_0_rgba(42,30,59,0.28)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(42,30,59,0.28)]"
                style={{ fontFamily: display, ["--d" as string]: `${180 + i * 45}ms` }}
              >
                <span className="truncate pt-0.5">{b.label}</span>
              </a>
            ))}
          </nav>
        )}

        <p className="mt-8 rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">@{card.username}</p>
      </main>
    </div>
  );
}
