/**
 * Physical card identifiers.
 *
 * `card_url` (the code) is what's written to the chip and printed in the QR —
 * permanent, unguessable, never reused. `serial` is the human number printed
 * next to it ("SC-000001"), for finding a card in a box, not for security.
 */

export const CARD_STATUSES = ["in_stock", "claimed", "active", "suspended", "retired"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_STATUS_LABEL: Record<CardStatus, string> = {
  in_stock: "In stock",
  claimed: "Claimed — not set up",
  active: "Active",
  suspended: "Suspended",
  retired: "Retired",
};

/** No l/o/0/1, so a code read aloud or off a print can't be misread. */
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** 8 characters from 32 = 40 bits, drawn from the platform CSPRNG. */
export function makeCardCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // 256 is a multiple of 32, so masking the low 5 bits is unbiased.
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join("");
}

export function isCardCode(value: string): boolean {
  return /^[a-z2-9]{6,16}$/.test(value);
}

export function formatSerial(serial: number | string | null | undefined): string {
  if (serial == null) return "SC-——————";
  return `SC-${String(serial).padStart(6, "0")}`;
}

/**
 * The permanent URL for a card. `via` tags which channel it's for — the
 * chip gets ?src=nfc, the printed QR ?src=qr — so taps and scans can be
 * counted apart. Untagged links (every card printed before this) still
 * work; they're just counted as "card, channel unknown".
 */
export function cardUrl(origin: string, code: string, via?: "nfc" | "qr"): string {
  return `${origin.replace(/\/$/, "")}/api/nfc/${code}${via ? `?src=${via}` : ""}`;
}

/** Pulls the card code back out of a scanned QR (any host, with or without a trailing slash or query). */
export function codeFromScan(scanned: string): string | null {
  const text = scanned.trim();
  const match = text.match(/\/api\/nfc\/([a-z2-9]{6,16})(?:[/?#]|$)/i);
  if (match) return match[1].toLowerCase();
  return isCardCode(text.toLowerCase()) ? text.toLowerCase() : null;
}

/** "K7P4QX2M" → "K7P4-QX2M", the way it's printed on packaging. */
export function formatActivationCode(code: string | null | undefined): string {
  const c = (code ?? "").toUpperCase();
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}
