/**
 * Default decorative backgrounds for templates that otherwise show a flat
 * page colour until the owner uploads a cover photo.
 *
 * Pop draws its own tinted "doodle" tile inline and always has one of
 * these two: a cover photo, or that pattern. Most other templates only had
 * the first half of that — no cover meant a plain `theme.surface` and
 * nothing else. This gives every template in BACKGROUND_PATTERN_DEFAULTS
 * (src/lib/card.ts) the same deal, each with its own default pick, while
 * still yielding to a cover photo exactly like Pop does — a template calls
 * this only when `!card.cover_url`.
 *
 * Reuses `card.background_style` (an existing, previously-unread column —
 * see its migration history) rather than adding a new one: "accent" (its
 * long-standing default value) now means "use this template's own pick",
 * a real id (`dots`/`doodle`/`waves`) is an explicit customer choice, and
 * "none" opts out to the old flat look.
 */

export type BackgroundPatternId = "dots" | "doodle" | "waves";

/**
 * What a template should actually draw: its own default for the "accent"
 * sentinel (or any legacy/unrecognised value — background_style predates
 * this feature, so most existing rows just carry whatever default they were
 * created with), the explicit choice for a real pattern id, or nothing for
 * "none".
 */
export function resolvePattern(
  value: string | null | undefined,
  templateDefault: BackgroundPatternId
): BackgroundPatternId | "none" {
  if (value === "none") return "none";
  if (value === "dots" || value === "doodle" || value === "waves") return value;
  return templateDefault;
}

function dotsTile(accent: string): string {
  return `radial-gradient(${accent}3A 1.6px, transparent 1.6px)`;
}

function wavesTile(accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="24" viewBox="0 0 120 24">
  <path d="M0 14 Q15 2 30 14 T60 14 T90 14 T120 14" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function doodleTile(surface: string, accent: string): string {
  // Deliberately simpler and lower-contrast than Pop's own doodle (that one
  // is Pop's whole identity; this is a quiet default for templates that
  // otherwise have none) — a handful of small shapes, not a busy scene.
  const c = [accent, "#FF9F6B", "#6BD4FF", "#B98BFF"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="${surface}"/>
  <g opacity="0.3">
    <circle cx="30" cy="34" r="10" fill="${c[0]}"/>
    <rect x="120" y="22" width="18" height="18" rx="5" fill="${c[1]}" transform="rotate(18 129 31)"/>
    <path d="M70 120l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="${c[2]}"/>
    <circle cx="150" cy="140" r="7" fill="${c[3]}"/>
    <path d="M20 150q12-16 24 0t24 0" fill="none" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function BackgroundPattern({
  pattern,
  accent,
  surface,
}: {
  pattern: BackgroundPatternId | "none" | null | undefined;
  accent: string;
  /** Tints the doodle tile's own ground so it blends with the page rather
   *  than drawing a visible square. */
  surface: string;
}) {
  if (!pattern || pattern === "none") return null;

  if (pattern === "dots") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: dotsTile(accent), backgroundSize: "22px 22px" }}
        aria-hidden="true"
      />
    );
  }

  if (pattern === "waves") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: wavesTile(accent), backgroundSize: "120px 24px", backgroundRepeat: "repeat" }}
        aria-hidden="true"
      />
    );
  }

  // "doodle"
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{ backgroundImage: doodleTile(surface, accent), backgroundSize: "180px 180px", backgroundRepeat: "repeat" }}
      aria-hidden="true"
    />
  );
}
