import { detectKind } from "./detect-link";
import type { CardButton } from "./card";

/**
 * Pulls every link, address and phone number out of a block of pasted text.
 *
 * People do not keep their links in a tidy list. They arrive as a WhatsApp
 * message, an email signature, a Notes page — one per line, or comma
 * separated, or buried in a sentence. Typing them back in one field at a time
 * is the slowest part of building a card, so this takes the lot at once and
 * works out what each one is.
 */

/** Trailing punctuation belongs to the sentence, not the URL. */
function trimTrailing(value: string): string {
  let out = value;
  while (out && /[.,;:!?)\]}>"']$/.test(out)) {
    // A closing bracket that has a matching opener is part of the link.
    const last = out.slice(-1);
    if (last === ")" && (out.match(/\(/g)?.length ?? 0) > (out.match(/\)/g)?.length ?? 0) - 1) {
      break;
    }
    out = out.slice(0, -1);
  }
  return out;
}

const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+(?:\/[^\s<>"']*)?)/gi;
const EMAIL_RE = /[^\s<>"',;]+@[^\s<>"',;]+\.[a-z]{2,}/gi;
// A separator is allowed straight after the country code: people write
// "+92 300 1234567", and requiring a digit there matched the "00" inside
// "300" instead and produced a number nine digits long.
const PHONE_RE = /(?:\+?92|0)[\s-]?\d[\d\s()-]{7,}\d/g;

export type ParsedLink = {
  value: string;
  kind: CardButton["kind"];
  /** Set when the same target already exists, so it can be reported not added. */
  duplicate?: boolean;
};

/**
 * What two values have to share to count as the same link.
 *
 * Compared on host plus path rather than the raw string: someone pasting a
 * list they half-typed twice will have `instagram.com/x` and
 * `https://www.instagram.com/x/`, which are one link.
 */
function identity(value: string): string {
  const v = value.trim().toLowerCase();
  if (v.includes("@") && !v.includes("/")) return `mail:${v.replace(/^mailto:/, "")}`;
  if (/^[+\d\s()-]+$/.test(v)) return `tel:${v.replace(/\D/g, "").replace(/^0092|^92|^0/, "")}`;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return v;
  }
}

/**
 * Everything worth adding from a block of text.
 *
 * Order is the order they were pasted in — someone who listed their links in
 * a deliberate order gets that order back, rather than an alphabetical one
 * they did not ask for.
 */
export function parseLinks(text: string, existing: CardButton[] = []): ParsedLink[] {
  if (!text?.trim()) return [];

  const seen = new Set(existing.map((b) => identity(b.value ?? "")));
  const found: ParsedLink[] = [];

  const push = (raw: string, mustBe?: CardButton["kind"]) => {
    const value = trimTrailing(raw.trim());
    if (!value) return;
    // The phone pass hands us anything digit-shaped. A twenty-digit order
    // number contains a run that looks like a mobile, and without this it
    // was added as a generic "link".
    if (mustBe && detectKind(value) !== mustBe) return;
    const id = identity(value);
    if (!id || id === "mail:" || id === "tel:") return;
    if (seen.has(id)) {
      // Reported rather than dropped silently: someone who pasted a list
      // twice should be told nothing was added, not left wondering.
      if (!found.some((f) => identity(f.value) === id)) {
        found.push({ value, kind: detectKind(value) ?? "link", duplicate: true });
      }
      return;
    }
    seen.add(id);
    found.push({ value, kind: detectKind(value) ?? "link" });
  };

  // Emails and phones first, then strip them so the URL pass cannot claim
  // "name@company.com" as the domain "company.com".
  let rest = text;
  for (const match of text.match(EMAIL_RE) ?? []) push(match);
  rest = rest.replace(EMAIL_RE, " ");

  for (const match of rest.match(URL_RE) ?? []) push(match);
  rest = rest.replace(URL_RE, " ");

  // Only values the detector agrees are phone numbers, so a long order
  // number containing a mobile-shaped run is left alone.
  for (const match of rest.match(PHONE_RE) ?? []) push(match, "phone");

  return found;
}
