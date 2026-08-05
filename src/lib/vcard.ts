import { normalizeWhatsapp } from "./referral";
import { resolveButtons, type CardButton } from "./card";

/** vCard escaping: commas, semicolons, backslashes and newlines are special. */
export function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold to 75 octets per RFC 2426, continuation lines starting with a space.
 *
 * Counted in UTF-8 bytes, not characters, and never split mid-character —
 * a break inside a multi-byte sequence corrupts it.
 */
function fold(line: string): string {
  // TextEncoder, not Buffer — this runs in the browser as well as the route.
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const out: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Back off until `end` sits on a character boundary (10xxxxxx = continuation).
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push(decoder.decode(bytes.subarray(start, end)));
    start = end;
    limit = 74; // continuation lines spend one octet on the leading space
  }
  return out.join("\r\n ");
}

/**
 * The subset of a profile a vCard actually carries.
 *
 * Loose on purpose: this is fed both by a `card_profiles` row on the server and
 * by an in-memory CardProfile in the browser, and those differ in the fields
 * they carry that a vCard doesn't use.
 */
export type VCardSource = {
  username: string;
  full_name: string;
  headline?: string | null;
  company?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  buttons?: CardButton[] | null;
};

/**
 * Build a vCard 3.0 payload for a profile.
 *
 * Kept free of any data access so the same text is produced whether the card
 * is a published row, an unsaved draft in the editor, or a demo persona on a
 * template preview — the three places the button appears.
 */
export function buildVCard(card: VCardSource, origin: string): string {
  const [firstName, ...rest] = (card.full_name || "").split(" ");
  const lastName = rest.join(" ");
  const whatsapp = normalizeWhatsapp(card.whatsapp ?? null);

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(lastName)};${escapeVCard(firstName ?? "")};;;`,
    `FN:${escapeVCard(card.full_name || "")}`,
  ];

  if (card.company) lines.push(`ORG:${escapeVCard(card.company)}`);
  if (card.headline) lines.push(`TITLE:${escapeVCard(card.headline)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(card.phone)}`);
  if (whatsapp) lines.push(`TEL;TYPE=WhatsApp:+${whatsapp}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(card.email)}`);
  if (card.location) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(card.location)};;;;`);
  if (card.bio) lines.push(`NOTE:${escapeVCard(card.bio)}`);
  // Only a fetchable URL. The placeholder avatars are inline `data:` SVGs, and
  // a 1.5KB data URI in PHOTO is rejected by most contact importers.
  if (card.avatar_url && /^https?:\/\//i.test(card.avatar_url)) {
    lines.push(`PHOTO;VALUE=URI:${escapeVCard(card.avatar_url)}`);
  }

  if (card.username) lines.push(`URL:${origin}/u/${card.username}`);

  // Only web buttons belong in a vCard URL field — tel:/mailto: kinds are
  // already covered by the TEL/EMAIL properties above.
  for (const button of resolveButtons(card.buttons ?? [])) {
    if (button.external && button.href.startsWith("http")) {
      lines.push(`URL:${escapeVCard(button.href)}`);
    }
  }

  lines.push("END:VCARD");
  return lines.map(fold).join("\r\n");
}

export function vcardFilename(card: VCardSource): string {
  const base = card.username?.trim() || card.full_name?.trim().replace(/\s+/g, "-") || "contact";
  return `${base.toLowerCase()}.vcf`;
}
