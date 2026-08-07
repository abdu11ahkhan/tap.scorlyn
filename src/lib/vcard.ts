import { normalizeWhatsapp } from "./referral";
import { KIND_LABELS, resolveButtons, type CardButton } from "./card";

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

/** Networks iOS and macOS file under "Social" instead of a plain link. */
const SOCIAL_TYPES: Partial<Record<CardButton["kind"], string>> = {
  x: "twitter",
  facebook: "facebook",
  linkedin: "linkedin",
  instagram: "instagram",
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

  // Item groups let each entry carry its own label. Without them a card with
  // six links imports as six identical "url" rows and the person cannot tell
  // the shop from the portfolio.
  let group = 0;
  const labelled = (property: string, value: string, label: string) => {
    group += 1;
    lines.push(`item${group}.${property}:${value}`);
    lines.push(`item${group}.X-ABLabel:${escapeVCard(label)}`);
  };

  if (card.username) labelled("URL", `${origin}/u/${card.username}`, "Card");

  // Every button, not just the web ones. Extra phone and email buttons used to
  // be dropped entirely: they are not `external`, so the old web-only filter
  // silently discarded a second number or address the owner had added.
  const seen = new Set(
    [card.phone, card.email, whatsapp].filter(Boolean).map((v) => String(v).replace(/\D/g, "") || String(v))
  );

  for (const button of resolveButtons(card.buttons ?? [])) {
    const label = button.label?.trim() || KIND_LABELS[button.kind] || "Link";
    const value = button.value.trim();
    const key = value.replace(/\D/g, "") || value;

    if (button.kind === "phone" || button.kind === "sms") {
      if (seen.has(key)) continue;
      seen.add(key);
      labelled("TEL", escapeVCard(value), label);
      continue;
    }

    if (button.kind === "email") {
      if (seen.has(value)) continue;
      seen.add(value);
      labelled("EMAIL", escapeVCard(value), label);
      continue;
    }

    if (button.kind === "whatsapp") continue; // already a TEL above

    if (button.external && button.href.startsWith("http")) {
      labelled("URL", escapeVCard(button.href), label);
      // iOS files known networks under Social rather than as another link.
      const social = SOCIAL_TYPES[button.kind];
      if (social) {
        lines.push(`X-SOCIALPROFILE;TYPE=${social}:${escapeVCard(button.href)}`);
      }
    }
  }

  // Lets a contacts app tell an updated card from the one already saved,
  // instead of creating a duplicate.
  lines.push(`REV:${new Date().toISOString().replace(/\.\d{3}/, "")}`);

  lines.push("END:VCARD");
  return lines.map(fold).join("\r\n");
}

export function vcardFilename(card: VCardSource): string {
  const base = card.username?.trim() || card.full_name?.trim().replace(/\s+/g, "-") || "contact";
  return `${base.toLowerCase()}.vcf`;
}
