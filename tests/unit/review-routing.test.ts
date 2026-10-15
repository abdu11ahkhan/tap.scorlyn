import test from "node:test";
import assert from "node:assert/strict";
import { decideReviewOutcome } from "../../src/lib/review-routing";

const GOOGLE_URL = "https://g.page/r/example/review";

test("1, 2 and 3 stars always open feedback, with or without a Google link", () => {
  assert.equal(decideReviewOutcome(1, GOOGLE_URL), "feedback");
  assert.equal(decideReviewOutcome(2, GOOGLE_URL), "feedback");
  assert.equal(decideReviewOutcome(3, GOOGLE_URL), "feedback");
  assert.equal(decideReviewOutcome(1, ""), "feedback");
  assert.equal(decideReviewOutcome(2, null), "feedback");
  assert.equal(decideReviewOutcome(3, undefined), "feedback");
});

test("4 and 5 stars go to Google when a review link is configured", () => {
  assert.equal(decideReviewOutcome(4, GOOGLE_URL), "google");
  assert.equal(decideReviewOutcome(5, GOOGLE_URL), "google");
});

test("4 and 5 stars fall back to the plain thank-you step with no Google link", () => {
  assert.equal(decideReviewOutcome(4, ""), "next");
  assert.equal(decideReviewOutcome(5, ""), "next");
  assert.equal(decideReviewOutcome(4, null), "next");
  assert.equal(decideReviewOutcome(5, undefined), "next");
});

test("out-of-range and non-integer ratings never reach Google", () => {
  // Below the scale: falls through to feedback, same as a genuine low rating.
  assert.equal(decideReviewOutcome(0, GOOGLE_URL), "feedback");
  assert.equal(decideReviewOutcome(-1, GOOGLE_URL), "feedback");
  // Above the scale: still routes to Google when one is configured — this
  // function trusts its caller for range, the same as the inline check it
  // replaced; the UI is what limits the real input to 1–5.
  assert.equal(decideReviewOutcome(6, GOOGLE_URL), "google");
  assert.equal(decideReviewOutcome(6, ""), "next");
  // Not a number: every comparison is false, landing on "next" — never
  // feedback, never Google.
  assert.equal(decideReviewOutcome(NaN, GOOGLE_URL), "next");
});
