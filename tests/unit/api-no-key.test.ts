/**
 * The same public routes with NO service-role key — local development, or a
 * production deploy where SUPABASE_SERVICE_ROLE_KEY was forgotten. In that
 * state the routes fall back to the anon client, which works only while the
 * anonymous write paths exist (i.e. before migration 070). This file fakes
 * that pre-070 database. Node runs each test file in its own process, so the
 * cached service client from api-limits.test.ts doesn't leak in here.
 */
import { mock, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { IP_HEADERS, fakeQuery, makeRequest } from "./fakes";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.test";
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.VERCEL;
process.env.TAP_HASH_SALT = "test-salt";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";
const REFERRER_ID = "00000000-0000-4000-8000-0000000000b2";
const CARD_ID = "00000000-0000-4000-8000-0000000000d4";

const state = {
  taps: [] as Record<string, unknown>[],
  feedback: [] as Record<string, unknown>[],
  referrals: [] as Record<string, unknown>[],
  rpcCalls: [] as string[],
  feedbackEmails: 0,
  firstTapEmails: 0,
  afterJobs: [] as (() => unknown)[],
  nfcRow: undefined as Record<string, unknown> | undefined,
};

// Pre-070 anon client: anonymous inserts and the feedback function are allowed.
const anon = {
  rpc: async (fn: string, args: Record<string, unknown>) => {
    state.rpcCalls.push(fn);
    if (fn === "resolve_nfc_card") return { data: state.nfcRow ? [state.nfcRow] : [], error: null };
    if (fn === "referrer_for_code") return { data: args.p_code === "GOODREF" ? REFERRER_ID : null, error: null };
    if (fn === "submit_review_feedback") {
      state.feedback.push(args);
      return { data: "fb", error: null };
    }
    return { data: null, error: { message: `no fake ${fn}` } };
  },
  from: fakeQuery((table, op, f, payload) => {
    if (table === "public_card_profiles") return { data: f.eq.username === "testperson" ? { id: PROFILE_ID } : null, error: null };
    if (table === "card_taps" && op === "insert") {
      state.taps.push(payload as Record<string, unknown>);
      return { data: null, error: null };
    }
    if (table === "card_taps") return { data: null, error: null, count: 0 }; // owner-only RLS
    if (table === "referral_events" && op === "insert") {
      state.referrals.push(payload as Record<string, unknown>);
      return { data: null, error: null };
    }
    return { data: null, error: null };
  }),
};

const require = createRequire(import.meta.url);
const realNext = require("next/server.js");

mock.module("@supabase/supabase-js", {
  namedExports: {
    createClient: () => {
      throw new Error("no service-role client may be created without a key");
    },
  },
});
mock.module("@/lib/supabase/server", { namedExports: { createClient: async () => anon } });
mock.module("@/lib/email", {
  namedExports: {
    mailerConfigured: () => true,
    sendFeedbackAlert: async () => void state.feedbackEmails++,
    sendFirstTap: async () => void state.firstTapEmails++,
  },
});
mock.module("next/server", { namedExports: { ...realNext, after: (fn: () => unknown) => void state.afterJobs.push(fn) } });

const tap = await import("../../src/app/api/tap/route");
const feedback = await import("../../src/app/api/review-feedback/route");
const referral = await import("../../src/app/api/referral/route");
const nfc = await import("../../src/app/api/nfc/[cardId]/route");

beforeEach(() => {
  Object.assign(state, { taps: [], feedback: [], referrals: [], rpcCalls: [], feedbackEmails: 0, firstTapEmails: 0, afterJobs: [], nfcRow: undefined });
});

const headers = IP_HEADERS("203.0.113.5");

test("no key: taps still record (anon client), limits are skipped, first-tap email isn't guessed", async () => {
  state.nfcRow = { nfc_card_id: CARD_ID, card_profile_id: PROFILE_ID };
  for (let i = 0; i < 300; i++) {
    const r = await tap.POST(makeRequest("https://example.test/api/tap", { body: { username: "testperson", nfcCode: "abcd2345", source: "nfc" }, headers }) as never);
    assert.equal(r.status, 200);
  }
  assert.equal(state.taps.length, 300, "fail open: no limiter without the key");
  assert.equal(state.firstTapEmails, 0, "the owner-only count can't be trusted, so no email");
  assert.ok(!state.rpcCalls.includes("hit_rate_limit"));
});

test("no key: unknown cards still get a 404 and no write", async () => {
  const r = await tap.POST(makeRequest("https://example.test/api/tap", { body: { username: "nobody-here" }, headers }) as never);
  assert.equal(r.status, 404);
  assert.equal(state.taps.length, 0);
});

test("no key: feedback is saved; alert emails need the key and aren't sent", async () => {
  const r = await feedback.POST(
    makeRequest("https://example.test/api/review-feedback", { body: { username: "testbiz", rating: 2, message: "Cold" }, headers }) as never
  );
  assert.equal(r.status, 200);
  assert.equal(state.feedback.length, 1);
  assert.equal(state.feedbackEmails, 0);
});

test("no key: referral events record; the freshness check can't run and allows the signup", async () => {
  await referral.POST(makeRequest("https://example.test/api/referral", { body: { refCode: "GOODREF", eventType: "banner_view" }, headers }) as never);
  await referral.POST(
    makeRequest("https://example.test/api/referral", {
      body: { refCode: "GOODREF", eventType: "signup", referredUserId: "00000000-0000-4000-8000-000000000099" },
      headers,
    }) as never
  );
  assert.equal(state.referrals.length, 2);
});

test("no key: a one-link card still redirects and records its tap with the anon client", async () => {
  state.nfcRow = {
    nfc_card_id: CARD_ID,
    card_profile_id: PROFILE_ID,
    username: "testperson",
    is_single_purpose: true,
    redirect_kind: "whatsapp",
    redirect_value: "+92 300 0000000",
    redirect_message: null,
    status: "active",
    claimable: false,
  };
  const r = await nfc.GET(makeRequest("https://example.test/api/nfc/abcd2345?src=nfc", { headers }), { params: Promise.resolve({ cardId: "abcd2345" }) });
  assert.equal(r.headers.get("location"), "https://wa.me/923000000000");
  for (const job of state.afterJobs.splice(0)) await job();
  assert.equal(state.taps.length, 1);
  assert.equal(state.taps[0].source, "nfc");
  assert.ok(!state.rpcCalls.includes("is_live_card"), "the old insert policy does that check pre-070");
});
