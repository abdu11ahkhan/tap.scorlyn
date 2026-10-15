import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side rate limits for the public, unauthenticated write endpoints
 * (/api/tap, /api/review-feedback, /api/referral) and the feedback email
 * cooldown.
 *
 * Storage is the existing `api_rate_limits` table through hit_rate_limit()
 * (migration 064): a fixed-window counter in Postgres, so it holds across
 * Vercel's separate serverless instances. Only the service role may call it.
 *
 * What this does and does not stop. Keys are per IP, per visitor (IP + user
 * agent) and per card, so one client hammering one card is capped, and a
 * single client rotating user agents still hits the per-IP cap. It is NOT a
 * defence against a large distributed attack from many IPs; the per-card caps
 * only bound how much damage that does to any one card.
 *
 * Failure policy: if the limiter itself cannot be reached (no service key,
 * database error), requests are ALLOWED — a hiccup in this table must never
 * break a real customer's card, analytics or feedback. The email cooldown is
 * the one exception: it fails closed (no email), because the feedback is
 * already saved and visible in the dashboard either way.
 */

export type Rule = {
  /** Namespaced counter key, e.g. "tap:ip:<hash>". */
  key: string;
  windowSeconds: number;
  max: number;
};

export type RpcResult = { data: unknown; error: { code?: string; message?: string } | null };
export type Rpc = (fn: string, args: Record<string, unknown>) => PromiseLike<RpcResult>;

export type LimitResult = {
  allowed: boolean;
  /** Key of the rule that blocked the request, when one did. */
  blockedBy?: string;
  /** True when the limiter could not be consulted and the request was let through. */
  failedOpen?: boolean;
};

let admin: ReturnType<typeof createClient> | null | undefined;

/**
 * The service-role client, or null when the key isn't configured (local dev).
 * The public write endpoints use it for their writes too: migration 070
 * removes the anonymous insert/execute paths, so these routes — with their
 * limits in front — are the only way to write taps, referral events and
 * review feedback.
 */
export function serviceClient(): ReturnType<typeof createClient> | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  admin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  // Without the key the routes fall back to the anon client, which only works
  // until migration 070 removes the anonymous write paths. Say so loudly in
  // production logs rather than failing silently later.
  if (!admin && process.env.VERCEL) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set: rate limits are off and public writes use the anon client.");
  }
  return admin;
}

/** The service-role RPC caller, or null when the key isn't configured (local dev). */
export function defaultRpc(): Rpc | null {
  const client = serviceClient();
  if (!client) return null;
  const typed = client as unknown as { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<RpcResult> };
  return (fn, args) => typed.rpc(fn, args);
}

/**
 * Counts one hit against each rule, in order, stopping at the first one that
 * is over its limit. Order the cheapest, broadest rule first: once a client is
 * over the per-IP cap, the later counters are never written, so a flood costs
 * one counter update per request rather than one per rule.
 */
export async function checkLimits(rules: Rule[], rpc: Rpc | null = defaultRpc()): Promise<LimitResult> {
  if (!rpc) return { allowed: true, failedOpen: true };
  for (const rule of rules) {
    try {
      const { data, error } = await rpc("hit_rate_limit", {
        p_key: rule.key,
        p_window_seconds: rule.windowSeconds,
        p_max: rule.max,
      });
      if (error) return { allowed: true, failedOpen: true };
      if (data === false) return { allowed: false, blockedBy: rule.key };
    } catch {
      return { allowed: true, failedOpen: true };
    }
  }
  return { allowed: true };
}

/**
 * True when this caller may do the action now, and starts the cooldown.
 *
 * Exact when migration 069's claim_cooldown() exists: it takes a lock per key
 * and compares against the last claim, so "one per N seconds" holds with no
 * window-boundary double. Without it, falls back to hit_rate_limit with an
 * N-second fixed window — at most one per window, but two can land either
 * side of a window boundary. Any other failure returns false (fail closed).
 */
export async function claimCooldown(key: string, seconds: number, rpc: Rpc | null = defaultRpc()): Promise<boolean> {
  if (!rpc) return false;
  try {
    const exact = await rpc("claim_cooldown", { p_key: key, p_seconds: seconds });
    if (!exact.error) return exact.data === true;
    // PGRST202: PostgREST can't find the function; 42883: Postgres "undefined function".
    const missing = exact.error.code === "PGRST202" || exact.error.code === "42883";
    if (!missing) return false;
    const approx = await rpc("hit_rate_limit", { p_key: key, p_window_seconds: seconds, p_max: 1 });
    return !approx.error && approx.data === true;
  } catch {
    return false;
  }
}

/**
 * The client IP for rate limiting. Prefers headers Vercel itself sets
 * (x-vercel-forwarded-for, x-real-ip) over x-forwarded-for, whose leading
 * entry a client can try to supply. Off Vercel (local dev) everything may be
 * "unknown", which simply puts all local traffic in one bucket.
 */
export function rateLimitIp(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function digest(value: string): string {
  const salt = process.env.TAP_HASH_SALT ?? "scorlyntap-dev-salt";
  return createHash("sha256").update(`${salt}:rl:${value}`).digest("hex").slice(0, 24);
}

/**
 * Hashed identities for counter keys — raw IPs never reach the table.
 *  - ip: the network address only; can't be dodged by changing user agent.
 *  - visitor: IP + user agent, so people sharing one carrier/office IP
 *    (common on Pakistani mobile networks) get separate, tighter buckets.
 */
export function limitIdentity(headers: Headers): { ip: string; visitor: string } {
  const ip = rateLimitIp(headers);
  const ua = (headers.get("user-agent") ?? "").slice(0, 300);
  return { ip: digest(ip), visitor: digest(`${ip}|${ua}`) };
}

/** Uniform response for a rejected request: no detail about which limit. */
export function tooManyRequests(retryAfterSeconds = 60): NextResponse {
  return NextResponse.json(
    { error: "too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

/**
 * Reads a JSON body of at most `maxBytes` bytes. A declared Content-Length
 * over the cap is refused before reading; otherwise the stream is read with
 * a byte counter and abandoned the moment it passes the cap, so an oversized
 * or endless chunked body is never buffered whole. Malformed JSON reads as a
 * null body (the routes then answer 400).
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<{ body: unknown; tooLarge: boolean }> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { body: null, tooLarge: true };
  if (!request.body) return { body: null, tooLarge: false };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { body: null, tooLarge: true };
      }
      chunks.push(value);
    }
  } catch {
    return { body: null, tooLarge: false };
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  try {
    const text = new TextDecoder().decode(bytes);
    return { body: text ? JSON.parse(text) : null, tooLarge: false };
  } catch {
    return { body: null, tooLarge: false };
  }
}

/** Thresholds, in one place so they're easy to find and tune. */
/**
 * Thresholds, in one place so they're easy to find and tune.
 *
 * "Visitor" is IP + user agent. On shared networks — venue Wi-Fi, mobile
 * carrier NAT, which is common in Pakistan — many people can share both
 * (same phone model, same OS version), so the visitor caps are sized for a
 * small crowd rather than one person, and the per-IP caps for a large one.
 *
 * There are deliberately no hard per-card caps: a handful of attacking IPs
 * could fill a card's bucket and lock out its real visitors and reviewers.
 * The only per-card control is the feedback email cooldown, which never
 * rejects anything.
 */
export const LIMITS = {
  tap: {
    /** One page view fires ~1–4 events; 240/min ≈ 60+ people on one IP+UA. */
    visitorPerMinute: 240,
    /** A whole venue or carrier NAT address. */
    ipPerMinute: 900,
  },
  feedback: {
    /** Written feedback is a deliberate act; nobody legitimately sends 10 an hour. */
    visitorPerHour: 10,
    /** A busy restaurant's Wi-Fi, with many diners on the same phone model. */
    ipPerHour: 40,
    /** At most one alert email per card per this many seconds. */
    emailCooldownSeconds: 300,
  },
  referral: {
    /** banner_view fires once per profile view; 60/h covers heavy browsing. */
    visitorPerHour: 60,
    ipPerHour: 300,
    /**
     * "order" clicks are claimed by the browser and can't be verified, so
     * they are capped per day. "signup" is not counted here: it is already
     * limited to a real account created in the last day, once per account.
     */
    ordersPerVisitorPerDay: 5,
    ordersPerIpPerDay: 20,
  },
} as const;
