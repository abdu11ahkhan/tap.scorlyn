/**
 * Where a star rating on a Review card sends the visitor — the decision
 * only, with no React or DOM, so every branch is unit-tested
 * (tests/unit/review-routing.test.ts). ReviewFlow.tsx calls this and acts on
 * what it returns (tracking the right event, changing step, and — for
 * "google" — navigating away).
 *
 * 4–5 stars go straight to the business's Google review page, same tab.
 * 1–3 stars open the private feedback form first — but the Google link stays
 * available on every later screen (ReviewFlow renders it in "next",
 * "feedback" and "sent"). Google's policy forbids *selectively soliciting*
 * positive reviews; routing unhappy customers to feedback first is allowed
 * only while nobody is blocked from Google, so that link must never be
 * removed for low ratings — this function only decides where the flow goes
 * first, not what stays reachable afterward.
 */

export type ReviewOutcome = "google" | "feedback" | "next";

/**
 * `googleUrl` is whatever resolveReviewConfig() already validated (empty
 * string when unset or malformed) — this only checks truthiness, so a
 * missing, empty or otherwise falsy value behaves exactly like "no Google
 * link configured", same as the inline check this replaced.
 */
export function decideReviewOutcome(
  rating: number,
  googleUrl: string | null | undefined
): ReviewOutcome {
  if (rating >= 4 && googleUrl) return "google";
  if (rating <= 3) return "feedback";
  // Reached only by a 4 or 5 star rating with no Google link configured —
  // still a positive outcome, just nothing to redirect to.
  return "next";
}
