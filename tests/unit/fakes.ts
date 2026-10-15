/**
 * In-memory stand-ins for Supabase and the mailer, so route handlers can run
 * under `node --test` without touching any real database. Nothing here talks
 * to the network.
 */

export type Call = { fn: string; args: Record<string, unknown> };

/**
 * Emulates hit_rate_limit() (migration 064: fixed clock-aligned windows,
 * "hits <= max", one counter per key per window) and claim_cooldown()
 * (migration 069: last claim per key, strict "older than N seconds"), with a
 * controllable clock so window boundaries are deterministic.
 */
export class FakeLimiter {
  nowSec = 1_000_000_020; // 20s into a 60s window, well clear of a boundary
  counters = new Map<string, number>();
  cooldowns = new Map<string, number>();
  /** Set to make claim_cooldown look missing (migration 069 not run). */
  cooldownMissing = false;
  /** Set to make every limiter call fail. */
  failing = false;
  calls: Call[] = [];

  handles(fn: string): boolean {
    return fn === "hit_rate_limit" || fn === "claim_cooldown";
  }

  rpc = async (fn: string, args: Record<string, unknown>) => {
    this.calls.push({ fn, args });
    if (this.failing) return { data: null, error: { code: "XX000", message: "boom" } };
    if (fn === "hit_rate_limit") {
      const ws = Number(args.p_window_seconds);
      const w = Math.floor(this.nowSec / ws) * ws;
      const k = `${args.p_key}@${w}`;
      const n = (this.counters.get(k) ?? 0) + 1;
      this.counters.set(k, n);
      return { data: n <= Number(args.p_max), error: null };
    }
    if (fn === "claim_cooldown") {
      if (this.cooldownMissing) return { data: null, error: { code: "PGRST202", message: "not found" } };
      const key = String(args.p_key);
      const last = this.cooldowns.get(key);
      if (last !== undefined && last > this.nowSec - Number(args.p_seconds)) return { data: false, error: null };
      this.cooldowns.set(key, this.nowSec);
      return { data: true, error: null };
    }
    return { data: null, error: { code: "PGRST202", message: `no fake for ${fn}` } };
  };

  /** Keys that were counted, in order. */
  keys(): string[] {
    return this.calls.filter((c) => c.fn === "hit_rate_limit").map((c) => String(c.args.p_key));
  }
}

type Row = Record<string, unknown>;
export type Result = { data: unknown; error: { code?: string; message?: string } | null; count?: number | null };
export type Filters = { eq: Row; gte: Row; in: Row; select?: unknown };

/**
 * A tiny chainable query builder. `handler(table, op, filters, payload)`
 * decides the result; .eq/.gte/.in filters are collected so the handler can
 * honour them.
 */
export function fakeQuery(handler: (table: string, op: string, filters: Filters, payload?: unknown) => Result) {
  return (table: string) => {
    const filters: Filters = { eq: {}, gte: {}, in: {} };
    let op = "select";
    let payload: unknown;
    const builder: Record<string, unknown> = {};
    const chain = (name: string) => (...args: unknown[]) => {
      if (name === "eq" || name === "gte" || name === "in") filters[name][String(args[0])] = args[1];
      if (name === "insert") {
        op = "insert";
        payload = args[0];
      }
      if (name === "select" && op === "select") filters.select = args[0];
      return builder;
    };
    for (const n of ["select", "eq", "gte", "in", "order", "limit", "insert"]) builder[n] = chain(n);
    builder.maybeSingle = async () => handler(table, op === "insert" ? "insert" : "maybeSingle", filters, payload);
    builder.single = builder.maybeSingle;
    // Awaiting the builder directly (an insert, or a head/count select).
    builder.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => {
      try {
        return Promise.resolve(handler(table, op, filters, payload)).then(resolve, reject);
      } catch (e) {
        return reject(e);
      }
    };
    return builder;
  };
}

/** Builds a Request the route handlers accept (they read .nextUrl.origin). */
export function makeRequest(
  url: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string>; rawBody?: string } = {}
) {
  const body = init.rawBody ?? (init.body === undefined ? undefined : JSON.stringify(init.body));
  const req = new Request(url, {
    method: init.method ?? (body ? "POST" : "GET"),
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    body,
  });
  return Object.assign(req, { nextUrl: new URL(url) });
}

/** Headers as Vercel delivers them: the platform-set client IP plus a UA. */
export const IP_HEADERS = (ip: string, ua = "Mozilla/5.0 (test phone)"): Record<string, string> => ({
  "x-vercel-forwarded-for": ip,
  "user-agent": ua,
});
