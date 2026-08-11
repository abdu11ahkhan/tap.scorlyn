import type { ButtonKind } from "./card";

/**
 * Works out what a pasted value actually is.
 *
 * People paste a URL and then have to go back and set the kind by hand, which
 * decides the icon and the default label — so a card ends up with six
 * identical "Link" buttons because nobody bothered. The value already says
 * what it is; this reads it.
 *
 * Host-based rather than substring matching: "instagram" appears in plenty of
 * URLs that are not Instagram, and matching those would relabel someone's blog
 * post as their profile.
 */
const HOSTS: { kind: ButtonKind; hosts: string[] }[] = [
  { kind: "instagram", hosts: ["instagram.com", "instagr.am"] },
  { kind: "linkedin", hosts: ["linkedin.com", "lnkd.in"] },
  { kind: "x", hosts: ["x.com", "twitter.com", "t.co"] },
  { kind: "github", hosts: ["github.com"] },
  { kind: "facebook", hosts: ["facebook.com", "fb.com", "fb.me"] },
  { kind: "tiktok", hosts: ["tiktok.com"] },
  { kind: "youtube", hosts: ["youtube.com", "youtu.be"] },
  { kind: "telegram", hosts: ["t.me", "telegram.me"] },
  { kind: "pinterest", hosts: ["pinterest.com", "pin.it"] },
  { kind: "discord", hosts: ["discord.gg", "discord.com"] },
  { kind: "twitch", hosts: ["twitch.tv"] },
  { kind: "behance", hosts: ["behance.net"] },
  { kind: "dribbble", hosts: ["dribbble.com"] },
  { kind: "medium", hosts: ["medium.com"] },
  { kind: "spotify", hosts: ["spotify.com", "open.spotify.com"] },
  { kind: "calendar", hosts: ["calendly.com", "cal.com", "koalendar.com"] },
  { kind: "maps", hosts: ["maps.google.com", "goo.gl", "maps.app.goo.gl"] },
  { kind: "whatsapp", hosts: ["wa.me", "whatsapp.com", "api.whatsapp.com"] },
];

/**
 * Pakistani mobile: 11 digits starting 03, or the same internationally.
 *
 * The three forms are 03001234567 (11), 923001234567 (12) and
 * 00923001234567 (14). The last was written as 13, which is 0092 plus nine
 * digits — a number that does not exist — so anyone who wrote their number
 * that way never had it recognised.
 */
function looksLikePakistaniMobile(digits: string): boolean {
  return (
    (digits.length === 11 && digits.startsWith("03")) ||
    (digits.length === 12 && digits.startsWith("92")) ||
    (digits.length === 14 && digits.startsWith("0092"))
  );
}

/**
 * The kind a value implies, or null when it is genuinely just a link.
 *
 * Returning null rather than guessing matters: overriding a choice someone
 * made by hand is worse than leaving it alone.
 */
export function detectKind(raw: string): ButtonKind | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith("mailto:")) return "email";
  if (value.startsWith("tel:")) return "phone";
  if (value.startsWith("sms:")) return "sms";

  // A bare address, before any URL parsing — nothing else looks like this.
  if (/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value)) return "email";

  const digits = value.replace(/\D/g, "");
  // Only when the value is *only* a number: "shop.com/03001234567" is a link.
  if (/^[+\d\s()-]+$/.test(value) && looksLikePakistaniMobile(digits)) {
    return "phone";
  }

  let host: string;
  try {
    host = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }

  for (const entry of HOSTS) {
    // Exact host or a subdomain of it — never a substring, so "notinstagram.com"
    // and "instagram.com.example.net" are both correctly left alone.
    if (entry.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return entry.kind;
    }
  }

  return null;
}
