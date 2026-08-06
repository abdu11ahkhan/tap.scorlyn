import { createHash } from "crypto";

/** Query param carrying the referrer's code, e.g. /u/abdullah?ref=k7m2xqp */
export const REF_PARAM = "ref";

/** Cookie the ref code is parked in so it survives the trip to /signup. */
export const REF_COOKIE = "tapzar_ref";

/** 30 days — long enough for "I'll order one later" to still attribute. */
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Stable per-visitor-per-day identifier. Lets us count unique taps without
 * ever storing an IP address.
 */
export function visitorHash(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.TAP_HASH_SALT ?? "tapzar-dev-salt";
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

/**
 * Same, but landing on the order form.
 *
 * Routed through signup rather than straight to /dashboard/orders so the ref
 * code still gets parked in its cookie — going direct would bounce through
 * /login and lose the attribution for the referrer.
 */
export function referralOrderUrl(refCode: string | null | undefined): string {
  const next = `next=${encodeURIComponent("/dashboard/orders")}`;
  return refCode
    ? `/signup?${REF_PARAM}=${encodeURIComponent(refCode)}&${next}`
    : `/signup?${next}`;
}

/** Pakistan. The only market this ships to, and the default for local numbers. */
const COUNTRY_CODE = "92";

/**
 * A number wa.me will actually open.
 *
 * Digits only, and crucially in *international* form: wa.me has no country
 * context, so anything still in local 03xx form resolves to the wrong country.
 */
export function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) {
    // 00 is the international access prefix; what follows is already complete.
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    // A single leading 0 is the local trunk prefix. wa.me has no idea what
    // country that belongs to — it drops the 0 and reads 0328 4552495 as
    // +32 8455 2495, a Belgian number. This is the bug people actually hit,
    // because 03xx is how a Pakistani number is written everywhere here.
    digits = COUNTRY_CODE + digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("3")) {
    // Mobile typed bare, with neither trunk prefix nor country code.
    digits = COUNTRY_CODE + digits;
  }

  return digits.length >= 9 ? digits : null;
}

export function whatsappLink(raw: string | null | undefined, message?: string): string | null {
  const number = normalizeWhatsapp(raw);
  if (!number) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}
