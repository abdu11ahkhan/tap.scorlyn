import { createHash } from "crypto";

/** Query param carrying the referrer's code, e.g. /u/abdullah?ref=k7m2xqp */
export const REF_PARAM = "ref";

/** Cookie the ref code is parked in so it survives the trip to /signup. */
export const REF_COOKIE = "klyro_ref";

/** 30 days — long enough for "I'll order one later" to still attribute. */
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Stable per-visitor-per-day identifier. Lets us count unique taps without
 * ever storing an IP address.
 */
export function visitorHash(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.TAP_HASH_SALT ?? "klyro-dev-salt";
  return createHash("sha256")
    .update(`${salt}:${ip}:${userAgent}:${day}`)
    .digest("hex")
    .slice(0, 32);
}

/** Best-effort client IP behind the usual proxy headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Where the "get your own card" banner sends people. */
export function referralSignupUrl(refCode: string | null | undefined): string {
  return refCode ? `/signup?${REF_PARAM}=${encodeURIComponent(refCode)}` : "/signup";
}

/** wa.me needs digits only — strip +, spaces, dashes, parens. */
export function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export function whatsappLink(raw: string | null | undefined, message?: string): string | null {
  const number = normalizeWhatsapp(raw);
  if (!number) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}
