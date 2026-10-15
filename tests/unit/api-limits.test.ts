/**
 * Route-level tests for the public write endpoints. The real route handlers
 * run; Supabase (both the anon/session client and the service-role client),
 * the mailer and next/server's after() are replaced with in-memory fakes
 * (tests/unit/fakes.ts), so nothing reaches a database or sends an email.
 * Run with --experimental-test-module-mocks (see package.json "test:unit").
 */
import { mock, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { FakeLimiter, IP_HEADERS, fakeQuery, makeRequest, type Filters } from "./fakes";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key-for-tests";
process.env.TAP_HASH_SALT = "test-salt";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";
const OTHER_PROFILE_ID = "00000000-0000-4000-8000-0000000000a2";
const REFERRER_ID = "00000000-0000-4000-8000-0000000000b2";
const CARD_ID = "00000000-0000-4000-8000-0000000000d4";

const limiter = new FakeLimiter();
type Tap = Record<string, unknown> & { via: "service" | "anon" };
const state = {
  taps: [] as Tap[],
  feedback: [] as Record<string, unknown>[],
  referrals: [] as Record<string, unknown>[],
  feedbackEmails: [] as unknown[][],
  firstTapEmails: [] as unknown[],
  insertFails: false,
  /** Auth users the fake admin knows: id -> created_at. */
  users: new Map<string, string>(),
  getUserCalls: [] as string[],
  afterJobs: [] as (() => unknown)[],
  nfcRow: undefined as Record<string, unknown> | undefined,
  resolveThrows: false,
  liveCard: true,
};

const tapTable = (via: "service" | "anon") => (op: string, f: Filters, payload?: unknown) => {
  if (op === "insert") {
    if (state.insertFails) return { data: null, error: { message: 'relation "card_taps" secret detail' } };
    state.taps.push({ ...(payload as Record<string, unknown>), via });
    return { data: null, error: null };
  }
  // Count select. The anon client can't read taps (owner-only RLS), so it
  // always sees 0 — exactly the behaviour that made "first tap" email repeat.
  if (via === "anon") return { data: null, error: null, count: 0 };
  const n = state.taps.filter((t) => t.nfc_card_id === f.eq.nfc_card_id).length;
  return { data: null, error: null, count: n };
};

// --- the anon/session client the routes create with createClient() --------
const serverClient = {
  rpc: async (fn: string, args: Record<string, unknown>) => {
    if (fn === "resolve_nfc_card") {
      if (state.resolveThrows) throw new Error("connection reset: internal detail");
      return { data: state.nfcRow ? [state.nfcRow] : [], error: null };
    }
    if (fn === "referrer_for_code") return { data: args.p_code === "GOODREF" ? REFERRER_ID : null, error: null };
    if (fn === "submit_review_feedback") throw new Error("feedback must go through the service role");
    return { data: null, error: { message: `no fake ${fn}` } };
  },
  from: fakeQuery((table, op, f, payload) => {
    // The published-only view: unknown or unpublished handles come back empty.
    if (table === "public_card_profiles") {
      return { data: f.eq.username === "testperson" ? { id: PROFILE_ID } : null, error: null };
    }
    if (table === "card_taps") return tapTable("anon")(op, f, payload);
    if (table === "referral_events") throw new Error("referral events must go through the service role");
    return { data: null, error: null };
  }),
};

// --- the service-role client (limiter, writes, lookups, auth admin) -------
const adminClient = {
  rpc: async (fn: string, args: Record<string, unknown>) => {
    if (limiter.handles(fn)) return limiter.rpc(fn, args);
    if (fn === "is_live_card") return { data: state.liveCard, error: null };
    if (fn === "submit_review_feedback") {
      state.feedback.push({ ...args, card_profile_id: args.p_username === "otherbiz" ? OTHER_PROFILE_ID : PROFILE_ID, at: limiter.nowSec });
      return { data: "fb-id", error: null };
    }
    return { data: null, error: { code: "PGRST202", message: `no fake ${fn}` } };
  },
  from: fakeQuery((table, op, f, payload) => {
    if (table === "card_taps") return tapTable("service")(op, f, payload);
    if (table === "card_profiles") {
      const id = f.eq.username === "otherbiz" ? OTHER_PROFILE_ID : PROFILE_ID;
      return { data: { id, full_name: "Test Biz", user_id: REFERRER_ID }, error: null };
    }
    if (table === "profiles") return { data: { email: "owner@example.test", full_name: "Owner" }, error: null };
    if (table === "review_settings") return { data: { notify_email: "owner@example.test", share_token: "tok" }, error: null };
    if (table === "review_feedback") {
      // Honour the filters the route really sends: this card, created since the cutoff.
      const since = Date.parse(String(f.gte.created_at)) / 1000;
      const n = state.feedback.filter((r) => r.card_profile_id === f.eq.card_profile_id && Number(r.at) >= since).length;
      return { data: null, error: null, count: n };
    }
    if (table === "referral_events" && op === "insert") {
      if (state.insertFails) return { data: null, error: { code: "XX", message: "internal db detail" } };
      state.referrals.push(payload as Record<string, unknown>);
      return { data: null, error: null };
    }
    return { data: null, error: null };
  }),
  auth: {
    admin: {
      getUserById: async (id: string) => {
        state.getUserCalls.push(id);
        const created = state.users.get(id);
        return created
          ? { data: { user: { id, created_at: created } }, error: null }
          : { data: { user: null }, error: { status: 404, message: "User not found" } };
      },
    },
  },
};

const require = createRequire(import.meta.url);
const realNext = require("next/server.js");

// The routes compute "now" with Date.now(); keep it on the fake limiter's clock.
const realDateNow = Date.now;
Date.now = () => limiter.nowSec * 1000;

mock.module("@supabase/supabase-js", { namedExports: { createClient: () => adminClient } });
mock.module("@/lib/supabase/server", { namedExports: { createClient: async () => serverClient } });
mock.module("@/lib/email", {
  namedExports: {
    mailerConfigured: () => true,
    sendFeedbackAlert: async (...args: unknown[]) => void state.feedbackEmails.push(args),
    sendFirstTap: async (opts: unknown) => void state.firstTapEmails.push(opts),
  },
});
mock.module("next/server", {
  // after() is collected and run only once the response exists, like the real one.
  namedExports: { ...realNext, after: (fn: () => unknown) => void state.afterJobs.push(fn) },
});

const tap = await import("../../src/app/api/tap/route");
const feedback = await import("../../src/app/api/review-feedback/route");
const referral = await import("../../src/app/api/referral/route");
const nfc = await import("../../src/app/api/nfc/[cardId]/route");

const runAfterJobs = async () => {
  const jobs = state.afterJobs.splice(0);
  for (const j of jobs) await j();
};

beforeEach(() => {
  limiter.counters.clear();
  limiter.cooldowns.clear();
  limiter.calls = [];
  limiter.failing = false;
  limiter.cooldownMissing = false;
  limiter.nowSec = 1_000_000_020;
  Object.assign(state, {
    taps: [],
    feedback: [],
    referrals: [],
    feedbackEmails: [],
    firstTapEmails: [],
    insertFails: false,
    users: new Map(),
    getUserCalls: [],
    afterJobs: [],
    nfcRow: undefined,
    resolveThrows: false,
    liveCard: true,
  });
});

test.after(() => {
  Date.now = realDateNow;
});

const tapReq = (body: Record<string, unknown>, headers = IP_HEADERS("203.0.113.5")) =>
  makeRequest("https://example.test/api/tap", { body, headers });

// ------------------------------------------------------------------ /api/tap
test("tap: 240 events/min from one visitor are recorded, the next is rejected with nothing written", async () => {
  for (let i = 0; i < 240; i++) assert.equal((await tap.POST(tapReq({ username: "testperson", source: "nfc" }) as never)).status, 200);
  const blocked = await tap.POST(tapReq({ username: "testperson" }) as never);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "60");
  assert.deepEqual(await blocked.json(), { error: "too many requests" });
  assert.equal(state.taps.length, 240);
});

test("tap: the window resets after a minute", async () => {
  for (let i = 0; i < 241; i++) await tap.POST(tapReq({ username: "testperson" }) as never);
  limiter.nowSec += 60;
  assert.equal((await tap.POST(tapReq({ username: "testperson" }) as never)).status, 200);
});

test("tap: rotating the user agent doesn't escape the per-IP cap (900/min)", async () => {
  let accepted = 0;
  for (let i = 0; i < 1000; i++) {
    const r = await tap.POST(tapReq({ username: "testperson" }, IP_HEADERS("203.0.113.9", `ua-${i}`)) as never);
    if (r.status === 200) accepted++;
  }
  assert.equal(accepted, 900);
});

test("tap: attackers on several IPs can't lock a card's real visitors out", async () => {
  // Three attacking addresses, each to its own cap: 2,700 events on one card.
  for (const ip of ["203.0.113.66", "203.0.113.67", "203.0.113.68"]) {
    for (let i = 0; i < 1000; i++) await tap.POST(tapReq({ username: "testperson" }, IP_HEADERS(ip, `ua-${i}`)) as never);
  }
  // Many other people, same card: all recorded.
  for (let i = 0; i < 50; i++) {
    const r = await tap.POST(tapReq({ username: "testperson" }, IP_HEADERS(`198.51.100.${i}`)) as never);
    assert.equal(r.status, 200);
  }
  // Only per-IP and per-visitor counters exist.
  assert.ok(limiter.keys().every((k) => /^tap:(ip|v):[0-9a-f]{24}$/.test(k)));
});

test("tap: unknown or unpublished cards get a 404 and no write", async () => {
  for (const username of ["unpublished-card", "nobody-here"]) {
    assert.equal((await tap.POST(tapReq({ username }) as never)).status, 404);
  }
  assert.equal(state.taps.length, 0);
});

test("tap: a spoofed x-forwarded-for doesn't change the identity Vercel reports", async () => {
  for (let i = 0; i < 245; i++) {
    await tap.POST(tapReq({ username: "testperson" }, { ...IP_HEADERS("203.0.113.7"), "x-forwarded-for": `198.51.100.${i % 250}` }) as never);
  }
  assert.equal(state.taps.length, 240);
});

test("tap: without Vercel's header, x-real-ip is used; raw IPs never appear in keys", async () => {
  await tap.POST(tapReq({ username: "testperson" }, { "x-real-ip": "192.0.2.44", "user-agent": "ua" }) as never);
  await tap.POST(tapReq({ username: "testperson" }, { "x-real-ip": "192.0.2.44", "user-agent": "ua", "x-forwarded-for": "1.2.3.4" }) as never);
  const keys = limiter.keys();
  assert.ok(keys.every((k) => /^tap:(ip|v):[0-9a-f]{24}$/.test(k)), keys.join(","));
  assert.ok(!keys.some((k) => k.includes("192.0.2.44")));
  // Same x-real-ip => same identity, whatever x-forwarded-for says.
  assert.equal(keys[0], keys[2]);
});

test("tap: sources are kept as sent; unknown values fall back to link", async () => {
  for (const source of ["nfc", "qr", "card", "link", "evil"]) await tap.POST(tapReq({ username: "testperson", source }) as never);
  assert.deepEqual(state.taps.map((t) => t.source), ["nfc", "qr", "card", "link", "link"]);
});

test("tap: rows are written with the service role, not the anon client", async () => {
  await tap.POST(tapReq({ username: "testperson" }) as never);
  assert.equal(state.taps[0].via, "service");
});

test("tap: the first-tap email goes out once, not on every tap", async () => {
  state.nfcRow = { nfc_card_id: CARD_ID, card_profile_id: PROFILE_ID };
  for (let i = 0; i < 3; i++) await tap.POST(tapReq({ username: "testperson", nfcCode: "abcd2345", source: "nfc" }) as never);
  assert.equal(state.taps.filter((t) => t.nfc_card_id === CARD_ID).length, 3);
  assert.equal(state.firstTapEmails.length, 1);
});

test("tap: invalid input is rejected before any limiter or database work", async () => {
  for (const body of [{}, { username: 42 }, { username: "has spaces" }, { username: "x".repeat(80) }]) {
    assert.equal((await tap.POST(tapReq(body) as never)).status, 400);
  }
  assert.equal(limiter.calls.length, 0);
});

test("tap: a declared Content-Length over the cap is refused before reading", async () => {
  const req = makeRequest("https://example.test/api/tap", {
    rawBody: JSON.stringify({ username: "testperson" }),
    headers: { ...IP_HEADERS("203.0.113.5"), "content-length": "999999" },
  });
  assert.equal((await tap.POST(req as never)).status, 413);
  assert.equal(limiter.calls.length, 0);
});

test("tap: oversized bodies are refused, declared or not, counting bytes not characters", async () => {
  const pad = (n: number) => JSON.stringify({ username: "testperson", pad: "x".repeat(n) });
  const big = await tap.POST(makeRequest("https://example.test/api/tap", { rawBody: pad(10000), headers: IP_HEADERS("203.0.113.5") }) as never);
  assert.equal(big.status, 413);
  // 1,500 four-byte characters: 6,000 bytes but only 3,000 UTF-16 units.
  const wide = JSON.stringify({ username: "testperson", pad: "😀".repeat(1500) });
  const r = await tap.POST(makeRequest("https://example.test/api/tap", { rawBody: wide, headers: IP_HEADERS("203.0.113.5") }) as never);
  assert.equal(r.status, 413);
  // Chunked (no Content-Length): still capped while streaming.
  const stream = new ReadableStream({
    start(c) {
      for (let i = 0; i < 20; i++) c.enqueue(new TextEncoder().encode("x".repeat(1000)));
      c.close();
    },
  });
  const chunked = Object.assign(
    new Request("https://example.test/api/tap", { method: "POST", body: stream, headers: IP_HEADERS("203.0.113.5"), duplex: "half" } as RequestInit),
    { nextUrl: new URL("https://example.test/api/tap") }
  );
  assert.equal((await tap.POST(chunked as never)).status, 413);
});

test("tap: database errors are not echoed to the caller", async () => {
  state.insertFails = true;
  const r = await tap.POST(tapReq({ username: "testperson" }) as never);
  assert.equal(r.status, 500);
  assert.deepEqual(await r.json(), { error: "could not record" });
});

test("tap: if the limiter is down, events are still recorded (fail open)", async () => {
  limiter.failing = true;
  assert.equal((await tap.POST(tapReq({ username: "testperson" }) as never)).status, 200);
  assert.equal(state.taps.length, 1);
});

// --------------------------------------------------------- /api/review-feedback
const fbReq = (extra: Record<string, unknown> = {}, ip = "203.0.113.20", ua?: string) =>
  makeRequest("https://example.test/api/review-feedback", {
    body: { username: "testbiz", rating: 2, message: "Cold food", ...extra },
    headers: IP_HEADERS(ip, ua),
  });

test("feedback: every submission is saved, but only one email per card per 5 minutes", async () => {
  for (let i = 0; i < 3; i++) assert.equal((await feedback.POST(fbReq({ message: `note ${i}` }, "203.0.113.20", `ua${i}`) as never)).status, 200);
  assert.equal(state.feedback.length, 3, "nothing discarded during the cooldown");
  assert.equal(state.feedbackEmails.length, 1);
  limiter.nowSec += 299;
  await feedback.POST(fbReq({ message: "still cooling" }, "203.0.113.21") as never);
  assert.equal(state.feedbackEmails.length, 1, "cooldown is a full 5 minutes");
  limiter.nowSec += 2;
  await feedback.POST(fbReq({ message: "later" }, "203.0.113.22") as never);
  assert.equal(state.feedbackEmails.length, 2, "next email after the cooldown");
  assert.match(String(state.feedbackEmails[1][2]), /5 pieces of feedback in the last hour/);
});

test("feedback: the email count only includes this card, within the last hour", async () => {
  await feedback.POST(fbReq({ message: "too old" }, "203.0.113.29") as never); // this card, will be > 1h old
  await feedback.POST(fbReq({ username: "otherbiz" }, "203.0.113.30") as never); // another card
  limiter.nowSec += 3700; // more than an hour later
  await feedback.POST(fbReq({ message: "recent one" }, "203.0.113.31") as never); // this card, emails (count 1)
  limiter.nowSec += 400;
  await feedback.POST(fbReq({ message: "new one" }, "203.0.113.32") as never); // this card
  // 3 rows for this card exist, but only 2 are within the hour; otherbiz never counts.
  const last = String(state.feedbackEmails.at(-1)?.[2]);
  assert.match(last, /2 pieces of feedback in the last hour/);
});

test("feedback: cooldowns are per card", async () => {
  await feedback.POST(fbReq({}, "203.0.113.40") as never);
  await feedback.POST(fbReq({ username: "otherbiz" }, "203.0.113.41") as never);
  assert.equal(state.feedbackEmails.length, 2);
});

test("feedback: cooldown still holds when claim_cooldown isn't installed (fallback)", async () => {
  limiter.cooldownMissing = true;
  for (let i = 0; i < 3; i++) await feedback.POST(fbReq({ message: `n${i}` }, `203.0.113.5${i}`) as never);
  assert.equal(state.feedback.length, 3);
  assert.equal(state.feedbackEmails.length, 1);
});

test("feedback: no email when the limiter can't be reached (fail closed for mail only)", async () => {
  limiter.failing = true;
  assert.equal((await feedback.POST(fbReq() as never)).status, 200);
  assert.equal(state.feedback.length, 1, "the feedback itself is still saved");
  assert.equal(state.feedbackEmails.length, 0);
});

test("feedback: 10 per visitor per hour, then 429 and nothing stored", async () => {
  for (let i = 0; i < 10; i++) assert.equal((await feedback.POST(fbReq({ message: `m${i}` }) as never)).status, 200);
  const r = await feedback.POST(fbReq({ message: "eleventh" }) as never);
  assert.equal(r.status, 429);
  assert.equal(state.feedback.length, 10);
});

test("feedback: 40 per IP per hour even with rotating user agents; other IPs unaffected", async () => {
  let ok = 0;
  for (let i = 0; i < 50; i++) if ((await feedback.POST(fbReq({ message: `m${i}` }, "203.0.113.70", `ua-${i}`) as never)).status === 200) ok++;
  assert.equal(ok, 40);
  assert.equal((await feedback.POST(fbReq({}, "203.0.113.71") as never)).status, 200);
  assert.ok(!limiter.keys().some((k) => k.startsWith("fb:card:")), "no per-card counter");
});

test("feedback: honeypot and invalid input never reach the limiter or database", async () => {
  assert.equal((await feedback.POST(fbReq({ website: "http://spam" }) as never)).status, 200);
  assert.equal((await feedback.POST(fbReq({ rating: 9 }) as never)).status, 400);
  assert.equal((await feedback.POST(fbReq({ message: "", category: "" }) as never)).status, 400);
  assert.equal((await feedback.POST(fbReq({ username: "../../etc" }) as never)).status, 400);
  assert.equal(state.feedback.length, 0);
  assert.equal(limiter.calls.length, 0);
});

// --------------------------------------------------------------- /api/referral
const refReq = (body: Record<string, unknown>, ip = "203.0.113.80", ua?: string) =>
  makeRequest("https://example.test/api/referral", { body, headers: IP_HEADERS(ip, ua) });
const newUser = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("referral: a fresh signup is credited, looked up by its own id, written by the service role", async () => {
  const id = newUser(1);
  state.users.set(id, new Date(Date.now() - 60_000).toISOString());
  assert.equal((await referral.POST(refReq({ refCode: "GOODREF", eventType: "signup", referredUserId: id }) as never)).status, 200);
  assert.equal(state.referrals.length, 1);
  assert.equal(state.referrals[0].referred_user_id, id);
  assert.deepEqual(state.getUserCalls, [id]);
});

test("referral: old, unknown, made-up and self ids are quietly not credited", async () => {
  state.users.set(newUser(2), new Date(Date.now() - 30 * 86400_000).toISOString());
  for (const referredUserId of [newUser(2), newUser(3) /* valid uuid, no such user */, "not-a-uuid", REFERRER_ID]) {
    const r = await referral.POST(refReq({ refCode: "GOODREF", eventType: "signup", referredUserId }) as never);
    assert.equal(r.status, 200, "same quiet answer, nothing revealed");
  }
  assert.equal(state.referrals.length, 0);
});

test("referral: signups from one shared network aren't held to the order cap", async () => {
  // 30 genuine signups from one IP (different browsers): more than any order
  // cap, and all credited. Only the general 300/IP/hour bound applies.
  for (let i = 10; i < 40; i++) {
    state.users.set(newUser(i), new Date(Date.now() - 120_000).toISOString());
    const r = await referral.POST(refReq({ refCode: "GOODREF", eventType: "signup", referredUserId: newUser(i) }, "203.0.113.85", `ua-${i}`) as never);
    assert.equal(r.status, 200);
  }
  assert.equal(state.referrals.length, 30);
});

test("referral: unverifiable order claims are capped per visitor (5/day) and per IP (20/day)", async () => {
  let ok = 0;
  for (let i = 0; i < 7; i++) if ((await referral.POST(refReq({ refCode: "GOODREF", eventType: "order" }) as never)).status === 200) ok++;
  assert.equal(ok, 5);
  let ipOk = 0;
  for (let i = 0; i < 30; i++) {
    if ((await referral.POST(refReq({ refCode: "GOODREF", eventType: "order" }, "203.0.113.81", `ua-${i}`) as never)).status === 200) ipOk++;
  }
  assert.equal(ipOk, 20);
});

test("referral: 60 events per visitor per hour", async () => {
  let ok = 0;
  for (let i = 0; i < 65; i++) if ((await referral.POST(refReq({ refCode: "GOODREF", eventType: "banner_view" }) as never)).status === 200) ok++;
  assert.equal(ok, 60);
});

test("referral: malformed ids are dropped, not stored", async () => {
  await referral.POST(refReq({ refCode: "GOODREF", eventType: "banner_view", cardProfileId: "<script>" }) as never);
  assert.equal(state.referrals[0].card_profile_id, null);
});

test("referral: bad input is a 400 and database errors stay generic", async () => {
  assert.equal((await referral.POST(refReq({ refCode: "GOODREF", eventType: "hack" }) as never)).status, 400);
  assert.equal((await referral.POST(refReq({ refCode: "a b", eventType: "banner_view" }) as never)).status, 400);
  state.insertFails = true;
  const r = await referral.POST(refReq({ refCode: "GOODREF", eventType: "banner_click" }) as never);
  assert.deepEqual(await r.json(), { error: "could not record" });
});

// -------------------------------------------------------------- /api/nfc/[id]
const nfcGet = (code: string, src?: string) =>
  nfc.GET(makeRequest(`https://example.test/api/nfc/${code}${src ? `?src=${src}` : ""}`, { headers: IP_HEADERS("203.0.113.90") }), {
    params: Promise.resolve({ cardId: code }),
  });

const assigned = {
  nfc_card_id: CARD_ID,
  card_profile_id: PROFILE_ID,
  username: "testperson",
  is_single_purpose: false,
  redirect_kind: null,
  redirect_value: null,
  redirect_message: null,
  status: "active",
  claimable: false,
};
const oneLink = { ...assigned, is_single_purpose: true, redirect_kind: "whatsapp", redirect_value: "+92 300 0000000" };

test("nfc route: redirects match the decision for every state, without touching the limiter", async () => {
  state.nfcRow = undefined;
  assert.equal((await nfcGet("zzzz2345")).headers.get("location"), "https://example.test/card/not-set-up");
  state.nfcRow = { ...assigned, status: "suspended" };
  assert.equal((await nfcGet("abcd2345")).headers.get("location"), "https://example.test/card/inactive");
  state.nfcRow = { ...assigned, status: "in_stock", claimable: true, card_profile_id: null, username: null };
  assert.equal((await nfcGet("abcd2345")).headers.get("location"), "https://example.test/activate/abcd2345");
  state.nfcRow = assigned;
  assert.equal((await nfcGet("abcd2345", "nfc")).headers.get("location"), "https://example.test/u/testperson?src=nfc&nfc=abcd2345");
  assert.equal((await nfcGet("abcd2345", "qr")).headers.get("location"), "https://example.test/u/testperson?src=qr&nfc=abcd2345");
  assert.equal((await nfcGet("abcd2345")).headers.get("location"), "https://example.test/u/testperson?src=card&nfc=abcd2345");
  assert.equal(limiter.calls.length, 0);
  assert.equal(state.afterJobs.length, 0);
});

test("nfc route: a one-link card redirects first, then records the tap with its source", async () => {
  state.nfcRow = oneLink;
  const r = await nfcGet("abcd2345", "qr");
  assert.equal(r.headers.get("location"), "https://wa.me/923000000000");
  assert.equal(state.taps.length, 0, "nothing written before the response");
  assert.equal(limiter.calls.length, 0, "limiter not on the redirect's path");
  await runAfterJobs();
  assert.ok(limiter.calls.length > 0, "limits applied after the response");
  assert.equal(state.taps.length, 1);
  assert.equal(state.taps[0].source, "qr");
  assert.equal(state.taps[0].via, "service");
});

test("nfc route: no tap recorded for a card that isn't live", async () => {
  state.nfcRow = oneLink;
  state.liveCard = false;
  await nfcGet("abcd2345", "nfc");
  await runAfterJobs();
  assert.equal(state.taps.length, 0);
});

test("nfc route: a flooded one-link card still redirects, but stops writing rows", async () => {
  state.nfcRow = oneLink;
  for (let i = 0; i < 260; i++) {
    const r = await nfcGet("abcd2345", "nfc");
    assert.equal(r.headers.get("location"), "https://wa.me/923000000000");
  }
  await runAfterJobs();
  assert.equal(state.taps.length, 240);
});

test("nfc route: a lookup failure is a plain 503, with no internal detail", async () => {
  state.resolveThrows = true;
  const r = await nfcGet("abcd2345", "nfc");
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("Retry-After"), "5");
  const text = await r.text();
  assert.match(text, /try again/i);
  assert.doesNotMatch(text, /connection reset|internal/);
});
