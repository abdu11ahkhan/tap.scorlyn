/**
 * The one place all three optional background effects live, instead of
 * duplicating each across 36 template files. Every effect is built from
 * the card's own accent colour — never a fixed hue — matching the same
 * rule GlassCard's own comment states for its orbs: "derived from the
 * owner's own accent color... so the ambient glow still reads as their
 * brand rather than a fixed platform color."
 *
 * Each effect reuses CSS classes that already existed before this file:
 * `.float-orb` (GlassCard/AuroraCard's drifting blur), `.gradient-pan`
 * (AuroraCard/SplitCard's animated wash), and the accent-grid pattern
 * NeonCard already draws inline. Pure CSS, no JS animation — the
 * templates stay server components (see globals.css's own comment on
 * why: a card opened by a physical NFC tap can't afford a framer-motion
 * bundle).
 */
export default function BackgroundEffect({
  effect,
  accent,
}: {
  effect: "none" | "glow" | "grid" | "gradient" | null | undefined;
  accent: string;
}) {
  if (!effect || effect === "none") return null;

  if (effect === "glow") {
    return (
      <div
        className="float-orb pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[520px] -translate-x-1/2 rounded-full opacity-25 blur-[110px]"
        style={{ background: accent }}
        aria-hidden="true"
      />
    );
  }

  if (effect === "grid") {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] opacity-[0.14]"
        style={{
          backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
          backgroundSize: "34px 34px",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
        aria-hidden="true"
      />
    );
  }

  // "gradient"
  return (
    <div
      className="gradient-pan pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage: `radial-gradient(at 20% 20%, ${accent}55 0px, transparent 55%), radial-gradient(at 80% 70%, ${accent}33 0px, transparent 55%)`,
      }}
      aria-hidden="true"
    />
  );
}
