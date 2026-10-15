"use client";

import { MotionConfig } from "framer-motion";

/**
 * Makes every framer-motion animation in the app respect the OS's "reduce
 * motion" setting, without touching each of the ~13 files that use
 * motion.* individually.
 *
 * `reducedMotion="user"` reads prefers-reduced-motion itself (and keeps
 * listening if it changes) — animated props still apply instantly, so
 * content still appears and transitions still fire, just without the
 * motion. Nothing changes for a visitor who hasn't asked for less motion.
 *
 * Pure CSS animations (globals.css's .gradient-pan, .pulse-ring, .card-rise,
 * .float-orb, the card templates' own reveal, review-step, spin-slow, bob…)
 * are unaffected by this — and don't need to be: they already sit behind
 * their own `@media (prefers-reduced-motion: reduce)` rules. Card templates
 * render as server components with no framer-motion of their own (see
 * BackgroundEffect.tsx), so this wrapper has nothing to do there either.
 *
 * A client boundary around server-rendered children, same shape as
 * HydrationFlag: layout.tsx stays a server component (keeps `metadata`
 * working) and everything passed in as `children` renders exactly as it
 * would have, just inside this provider.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
