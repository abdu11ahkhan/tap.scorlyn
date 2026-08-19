/**
 * A sensible printed card for someone who never chose one.
 *
 * Six of ten live cards have no NFC design, so there is nothing to print for
 * them. Waiting for each customer to answer a question they never saw is not
 * a plan; picking something defensible and letting them change it is.
 *
 * The rule is deliberately dull. Five templates share a name with a finish, so
 * those match exactly. Everything else falls back on tone: a dark web card
 * gets a dark card, a light one gets a light card. Nobody is surprised by
 * their card looking like their page.
 */

/** Templates whose name is also a finish — an exact match, no judgement needed. */
const SAME_NAME = new Set(["minimal", "bold", "mono", "split", "sticker"]);

/**
 * Templates that render on a dark ground. Mirrors TEMPLATE_TONE in
 * components/card-templates/index.tsx, computed from its actual background
 * colours rather than kept by hand — anything below 0.4 relative luminance.
 * Duplicated rather than imported because that module pulls in all 36
 * templates, and this is read by server actions.
 */
const DARK_TEMPLATES = new Set([
  "agency",
  "aurora",
  "dock",
  "filmstrip",
  "glass",
  "launch",
  "lookbook",
  "mono",
  "mosaic",
  "neon",
  "orbit",
  "pitch",
  "poster",
  "reel",
  "showcase",
  "waitlist",
]);

/** Neutral defaults: clean, printable, and unlikely to offend anyone's taste. */
const DARK_DEFAULT = "midnight";
const LIGHT_DEFAULT = "minimal";

/**
 * What to print for a card whose owner never picked.
 *
 * Always returns something valid, so a template added later still gets a
 * printable answer rather than blocking the order.
 */
export function suggestedFinish(template: string | null | undefined): string {
  const id = (template ?? "").trim().toLowerCase();
  if (SAME_NAME.has(id)) return id;
  return DARK_TEMPLATES.has(id) ? DARK_DEFAULT : LIGHT_DEFAULT;
}

/** Why that finish was chosen, for the confirmation shown to admin. */
export function suggestionReason(template: string | null | undefined): string {
  const id = (template ?? "").trim().toLowerCase();
  if (SAME_NAME.has(id)) return `matches their "${id}" template`;
  return DARK_TEMPLATES.has(id)
    ? "dark card, to match their page"
    : "light card, to match their page";
}
