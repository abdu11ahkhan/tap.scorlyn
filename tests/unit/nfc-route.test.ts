import test from "node:test";
import assert from "node:assert/strict";
import { decideNfcRoute, nfcSource, type ResolvedNfcCard } from "../../src/lib/nfc-route";

// Fictional fixtures only: no real card codes or customers.
const CODE = "abcd2345";
const base: ResolvedNfcCard = {
  nfc_card_id: "00000000-0000-4000-8000-000000000001",
  card_profile_id: "00000000-0000-4000-8000-000000000002",
  username: "testperson",
  is_single_purpose: false,
  redirect_kind: null,
  redirect_value: null,
  redirect_message: null,
  status: "active",
  claimable: false,
};

test("unknown code goes to the not-set-up page without the code", () => {
  assert.deepEqual(decideNfcRoute(undefined, CODE, null), { type: "redirect", location: "/card/not-set-up" });
});

test("suspended and retired cards go to the inactive page", () => {
  for (const status of ["suspended", "retired"]) {
    assert.deepEqual(decideNfcRoute({ ...base, status }, CODE, "nfc"), { type: "redirect", location: "/card/inactive" });
  }
});

test("a claimed card without a page goes to activation", () => {
  const d = decideNfcRoute({ ...base, status: "claimed", card_profile_id: null, username: null }, CODE, null);
  assert.deepEqual(d, { type: "redirect", location: `/activate/${CODE}` });
});

test("released stock goes to activation; held-back stock to not-set-up with the code", () => {
  const stock = { ...base, status: "in_stock", card_profile_id: null, username: null };
  assert.equal(decideNfcRoute({ ...stock, claimable: true }, CODE, null).location, `/activate/${CODE}`);
  assert.equal(decideNfcRoute({ ...stock, claimable: false }, CODE, null).location, `/card/not-set-up?c=${CODE}`);
});

test("an assigned card opens the profile with its source and code", () => {
  assert.equal(decideNfcRoute(base, CODE, "nfc").location, `/u/testperson?src=nfc&nfc=${CODE}`);
  assert.equal(decideNfcRoute(base, CODE, "qr").location, `/u/testperson?src=qr&nfc=${CODE}`);
  // Untagged cards (printed before the tags) are recorded as "card", never guessed.
  assert.equal(decideNfcRoute(base, CODE, null).location, `/u/testperson?src=card&nfc=${CODE}`);
  assert.equal(decideNfcRoute(base, CODE, "bogus").location, `/u/testperson?src=card&nfc=${CODE}`);
});

test("status absent (rows from before migration 061) reads as live", () => {
  const d = decideNfcRoute({ ...base, status: undefined }, CODE, "nfc");
  assert.equal(d.type, "redirect");
  assert.match(d.location, /^\/u\/testperson/);
});

test("a one-link card goes straight to its action, keeping the source", () => {
  const card = { ...base, is_single_purpose: true, redirect_kind: "whatsapp", redirect_value: "+92 300 0000000" };
  const d = decideNfcRoute(card, CODE, "qr");
  assert.equal(d.type, "direct");
  assert.equal(d.location, "https://wa.me/923000000000");
  assert.equal(d.type === "direct" ? d.source : null, "qr");
});

test("a one-link card with nothing to open falls back to the profile", () => {
  const card = { ...base, is_single_purpose: true, redirect_kind: "whatsapp", redirect_value: "" };
  assert.equal(decideNfcRoute(card, CODE, "nfc").location, `/u/testperson?src=nfc&nfc=${CODE}`);
});

test("odd characters in a code are encoded, never injected into the URL", () => {
  assert.equal(decideNfcRoute(base, "a&b=c/d", "nfc").location, "/u/testperson?src=nfc&nfc=a%26b%3Dc%2Fd");
});

test("nfcSource only trusts the two tags", () => {
  assert.equal(nfcSource("nfc"), "nfc");
  assert.equal(nfcSource("qr"), "qr");
  assert.equal(nfcSource("link"), "card");
  assert.equal(nfcSource(undefined), "card");
});
