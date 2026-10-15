import test from "node:test";
import assert from "node:assert/strict";
import { activationStep, checkActivationCode, normalizeActivationCode } from "../../src/lib/activation";

test("activation page states", () => {
  assert.equal(activationStep({ exists: false }, true), "not-found");
  assert.equal(activationStep({ exists: true, is_owner: true, status: "claimed" }, true), "owner");
  assert.equal(activationStep({ exists: true, status: "active" }, true), "in-use");
  assert.equal(activationStep({ exists: true, status: "in_stock", claimable: false }, true), "not-ready");
  assert.equal(activationStep({ exists: true, status: "in_stock", claimable: true }, false), "sign-in");
  assert.equal(activationStep({ exists: true, status: "in_stock", claimable: true, my_claim: "pending" }, true), "pending");
  assert.equal(activationStep({ exists: true, status: "in_stock", claimable: true, pending_other: true }, true), "pending-other");
  assert.equal(activationStep({ exists: true, status: "in_stock", claimable: true }, true), "claim");
  // A declined earlier request lands back on the claim screen (with a notice).
  assert.equal(activationStep({ exists: true, status: "in_stock", claimable: true, my_claim: "rejected" }, true), "claim");
});

test("codes are compared without dashes, spaces or case", () => {
  assert.equal(normalizeActivationCode(" abcd-efgh "), "ABCDEFGH");
});

test("valid, incomplete and invalid codes", () => {
  assert.deepEqual(checkActivationCode("abcd-efgh"), { ok: true, code: "ABCDEFGH" });
  assert.deepEqual(checkActivationCode("KMNP 2345"), { ok: true, code: "KMNP2345" });
  assert.deepEqual(checkActivationCode(""), { ok: false, reason: "empty" });
  assert.deepEqual(checkActivationCode("--"), { ok: false, reason: "empty" });
  assert.deepEqual(checkActivationCode("ABCD-EFG"), { ok: false, reason: "incomplete" });
  assert.deepEqual(checkActivationCode("ABCD-EFG0"), { ok: false, reason: "invalid" }); // 0 is never used
  assert.deepEqual(checkActivationCode("ABCDEFGHJ"), { ok: false, reason: "invalid" }); // too long
  assert.deepEqual(checkActivationCode("ABCD1EFG"), { ok: false, reason: "invalid" }); // 1 is never used
});
