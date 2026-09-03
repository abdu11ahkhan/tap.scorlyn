import { normalizeWhatsapp } from "@/lib/referral";

export type ButtonKind =
  // contact
  | "link"
  | "whatsapp"
  | "phone"
  | "email"
  | "sms"
  | "maps"
  // social
  | "instagram"
  | "linkedin"
  | "x"
  | "github"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "telegram"
  | "pinterest"
  | "discord"
  | "twitch"
  // work & money
  | "behance"
  | "dribbble"
  | "medium"
  | "spotify"
  | "calendar"
  | "shop"
  | "menu"
  | "resume"
  | "pay";

/** Grouping for the editor's kind picker, so the list stays scannable. */
export const BUTTON_KIND_GROUPS: { label: string; kinds: ButtonKind[] }[] = [
  { label: "Contact", kinds: ["whatsapp", "phone", "sms", "email", "maps", "link"] },
  {
    label: "Social",
    kinds: [
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
      "x",
      "linkedin",
      "telegram",
      "pinterest",
      "discord",
      "twitch",
    ],
  },
  {
    label: "Work & money",
    kinds: [
      "behance",
      "dribbble",
      "github",
      "medium",
      "spotify",
      "calendar",
      "shop",
      "menu",
      "resume",
      "pay",
    ],
  },
];

/** Placeholder shown in the editor for each kind. */
export const KIND_PLACEHOLDERS: Record<ButtonKind, string> = {
  link: "https://yoursite.com",
  whatsapp: "923001234567",
  phone: "+92 300 1234567",
  sms: "+92 300 1234567",
  email: "you@example.com",
  maps: "https://maps.app.goo.gl/...",
  instagram: "https://instagram.com/...",
  linkedin: "https://linkedin.com/in/...",
  x: "https://x.com/...",
  github: "https://github.com/...",
  facebook: "https://facebook.com/...",
  tiktok: "https://tiktok.com/@...",
  youtube: "https://youtube.com/@...",
  telegram: "https://t.me/...",
  pinterest: "https://pinterest.com/...",
  discord: "https://discord.gg/...",
  twitch: "https://twitch.tv/...",
  behance: "https://behance.net/...",
  dribbble: "https://dribbble.com/...",
  medium: "https://medium.com/@...",
  spotify: "https://open.spotify.com/...",
  calendar: "https://calendly.com/...",
  shop: "https://yourshop.com",
  menu: "https://yourmenu.com",
  resume: "https://.../cv.pdf",
  pay: "https://...",
};

/** Ready-made accent colours, so nobody has to fight a colour picker. */
export const ACCENT_PRESETS = [
  { name: "Ink", value: "#111111" },
  { name: "Acid", value: "#84CC16" },
  { name: "Emerald", value: "#059669" },
  { name: "Teal", value: "#0D9488" },
  { name: "Ocean", value: "#0284C7" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Fuchsia", value: "#C026D3" },
  { name: "Rose", value: "#E11D48" },
  { name: "Orange", value: "#EA580C" },
  { name: "Amber", value: "#D97706" },
  { name: "Clay", value: "#B45309" },
] as const;

/** Optional background effects a customer can layer on top of their own
 *  accent colour — see src/components/card-templates/BackgroundEffect.tsx
 *  for how each one actually renders. */
export const BACKGROUND_EFFECTS = [
  { id: "none", label: "none" },
  { id: "glow", label: "glow" },
  { id: "grid", label: "grid" },
  { id: "gradient", label: "gradient" },
] as const;

/** How the card's own elements animate in on load — see globals.css's
 *  [data-intro="..."] .card-rise overrides for how each one renders. */
export const INTRO_STYLES = [
  { id: "rise", label: "rise" },
  { id: "dropdown", label: "dropdown" },
  { id: "bubble", label: "bubble" },
  { id: "swipe", label: "swipe" },
] as const;

/**
 * Backgrounds a card can sit on, grouped by lightness.
 *
 * Split rather than one list because the templates hardcode their text
 * colours: a dark template's white text is unreadable on a pale ground, and a
 * light template's black text on a dark one. Staying within a family keeps
 * every one of those colours correct without touching the templates.
 */
/**
 * How readable a template's own text would be on a chosen background.
 *
 * The presets are safe by construction. A free colour is not, and a template
 * hardcodes its text as white-on-dark or black-on-light — so a picked colour
 * that lands in the wrong half turns type invisible in places nobody would
 * think to check. This returns the contrast ratio the text would actually
 * have, so the editor can say so before the card goes live.
 */
export function surfaceReadability(
  surface: string,
  family: "dark" | "light"
): { ratio: number; ok: boolean } {
  const hex = normalizeHex(surface);
  if (!hex) return { ratio: 21, ok: true };
  const bg = relativeLuminance(hex);
  // What the template paints its text with, at the extremes it assumes.
  const fg = family === "dark" ? 1 : 0;
  const [light, dark] = bg > fg ? [bg, fg] : [fg, bg];
  const ratio = (light + 0.05) / (dark + 0.05);
  // 4.5:1 is the WCAG AA threshold for body text.
  return { ratio: Math.round(ratio * 10) / 10, ok: ratio >= 4.5 };
}

export const SURFACE_PRESETS: {
  dark: { name: string; value: string }[];
  light: { name: string; value: string }[];
} = {
  dark: [
    { name: "Ink", value: "#0A0A0A" },
    { name: "Charcoal", value: "#16181D" },
    { name: "Navy", value: "#0B1220" },
    { name: "Forest", value: "#0C1712" },
    { name: "Plum", value: "#140B18" },
    { name: "Espresso", value: "#17110C" },
    { name: "Slate", value: "#12171C" },
    { name: "Wine", value: "#1A0B10" },
  ],
  light: [
    { name: "Paper", value: "#FFFFFF" },
    { name: "Bone", value: "#F7F4ED" },
    { name: "Mist", value: "#F1F4F7" },
    { name: "Sand", value: "#F6F1E7" },
    { name: "Blush", value: "#FBF1F1" },
    { name: "Sage", value: "#EFF4EF" },
    { name: "Sky", value: "#EEF3FA" },
    { name: "Stone", value: "#F2F2F0" },
  ],
};

export type CardButton = {
  label: string;
  kind: ButtonKind;
  value: string;
  /** Off keeps the link saved but hides it from the public card. */
  enabled?: boolean;
  /** WhatsApp only — pre-fills the chat's message box. */
  message?: string;
};

export type BusinessHour = { day: string; hours: string };

export type PaymentMethod = {
  label: string;
  kind: "bank" | "easypaisa" | "jazzcash" | "other";
  account_name?: string;
  account_number?: string;
  iban?: string;
};

export type GalleryItem = { url: string; caption?: string; href?: string };

export type CardProfile = {
  id: string;
  /** Owner. Optional because drafts and demo personas have no account yet. */
  user_id?: string | null;
  username: string;
  full_name: string;
  headline: string | null;
  company: string | null;
  bio: string | null;
  avatar_url: string | null;
  /** Full-bleed hero / backdrop image. Templates without a cover area ignore it. */
  cover_url: string | null;
  /** Company logo, drawn as a small watermark. Distinct from avatar_url. */
  logo_url: string | null;
  /** Offers the QR button on the public card. */
  show_qr: boolean;
  /** Background chosen by the owner. Null keeps the template as designed. */
  surface_color: string | null;
  /** Optional effect layered on top of the background, in the owner's own
   *  accent colour. Null/'none' keeps the flat (grain-only) look every
   *  template already has. */
  background_effect: "none" | "glow" | "grid" | "gradient" | null;
  /** Which entrance animation the card's elements use on load. Null/'rise'
   *  keeps every template's original default. */
  intro_style: "rise" | "dropdown" | "bubble" | "swipe" | null;
  /** 'cover' fills the hero area; 'tint' sits dimmed behind the whole page. */
  cover_mode: string | null;
  gallery: GalleryItem[];
  location: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  buttons: CardButton[];
  available_for_work: boolean;
  availability_note: string | null;
  business_hours: BusinessHour[];
  video_url: string | null;
  background_style: string | null;
  payment_enabled: boolean;
  payment_methods: PaymentMethod[];
  view_count: number;
  accent_color: string | null;
  template: string;
  font: string;
  referral_code: string | null;
  /** A card dedicated to one action — a tap opens that action directly,
   *  never this profile page. See resolveButton/cardLinkUrl. */
  is_single_purpose?: boolean;
};

export type ResolvedButton = CardButton & { href: string; external: boolean };

/** Turns a stored button into something an <a> can use. */
export function resolveButton(button: CardButton | null | undefined): ResolvedButton | null {
  if (!button) return null;
  const value = (button.value ?? "").trim();
  if (!value) return null;

  const base = { ...button, label: button.label?.trim() || defaultLabel(button.kind) };

  switch (button.kind) {
    case "whatsapp": {
      const number = normalizeWhatsapp(value);
      if (!number) return null;
      const text = button.message?.trim();
      const href = text
        ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
        : `https://wa.me/${number}`;
      return { ...base, href, external: true };
    }
    case "phone":
      return { ...base, href: `tel:${value.replace(/\s/g, "")}`, external: false };
    case "sms":
      return { ...base, href: `sms:${value.replace(/\s/g, "")}`, external: false };
    case "email":
      return { ...base, href: `mailto:${value}`, external: false };
    default:
      return { ...base, href: withProtocol(value), external: true };
  }
}

export function resolveButtons(buttons: unknown): ResolvedButton[] {
  if (!Array.isArray(buttons)) return [];
  return buttons
    // `enabled` is optional so older rows (no flag) stay visible.
    .filter((b) => (b as CardButton)?.enabled !== false)
    .map((b) => resolveButton(b as CardButton))
    .filter((b): b is ResolvedButton => b !== null);
}

/**
 * Same as resolveButtons, but keeps rows the user hasn't filled in yet so the
 * editor's live preview shows the layout they're building rather than a card
 * that looks empty until the last field is typed.
 */
export function resolveButtonsForPreview(buttons: CardButton[]): ResolvedButton[] {
  return buttons
    .map((button) => {
      const resolved = resolveButton(button);
      if (resolved) return resolved;
      return {
        ...button,
        label: button.label?.trim() || defaultLabel(button.kind),
        href: "#",
        external: false,
      };
    })
    .filter((b): b is ResolvedButton => Boolean(b.label));
}

function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * What a card actually opens: the profile page, or — for a single-purpose
 * card — its one action, directly.
 *
 * The single shared source of truth for both the printed QR and the NFC tap
 * handler, so the two can never point at different places. `origin` is the
 * site host (e.g. `https://tap.scorlyn.com` or `window.location.origin`).
 */
export function cardLinkUrl(
  card: Pick<CardProfile, "username" | "is_single_purpose" | "buttons">,
  origin: string
): string {
  if (card.is_single_purpose) {
    const resolved = resolveButton(card.buttons?.[0]);
    if (resolved) return resolved.href;
  }
  return `${origin}/u/${card.username}`;
}

export const KIND_LABELS: Record<ButtonKind, string> = {
  link: "Link",
  whatsapp: "WhatsApp",
  phone: "Call",
  sms: "Text",
  email: "Email",
  maps: "Directions",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  github: "GitHub",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  telegram: "Telegram",
  pinterest: "Pinterest",
  discord: "Discord",
  twitch: "Twitch",
  behance: "Behance",
  dribbble: "Dribbble",
  medium: "Medium",
  spotify: "Spotify",
  calendar: "Book a time",
  shop: "Shop",
  menu: "Menu",
  resume: "Resume",
  pay: "Pay me",
};

/** The name a kind goes by, for anything building a button from scratch. */
export function defaultLabelFor(kind: ButtonKind): string {
  return defaultLabel(kind);
}

function defaultLabel(kind: ButtonKind): string {
  return KIND_LABELS[kind] ?? "Link";
}

/**
 * A single-purpose card's action, offered on the "pick a purpose" entry
 * page. Distinct from ButtonKind: "link" covers three different purposes
 * here (review, website, file), each with its own label and placeholder,
 * which a keyed-by-kind list can't express.
 */
export type CardPurpose = {
  id: string;
  kind: ButtonKind;
  label: string;
  blurb: string;
  fieldLabel: string;
  placeholder: string;
};

export const CARD_PURPOSES: CardPurpose[] = [
  {
    id: "whatsapp",
    kind: "whatsapp",
    label: "WhatsApp",
    blurb: "A tap opens a chat with you, ready to send.",
    fieldLabel: "WhatsApp number",
    placeholder: "923001234567",
  },
  {
    id: "instagram",
    kind: "instagram",
    label: "Instagram",
    blurb: "A tap opens your Instagram profile.",
    fieldLabel: "Instagram link",
    placeholder: "https://instagram.com/...",
  },
  {
    id: "maps",
    kind: "maps",
    label: "Location",
    blurb: "A tap opens directions to your place.",
    fieldLabel: "Google Maps link",
    placeholder: "https://maps.app.goo.gl/...",
  },
  {
    id: "review",
    kind: "link",
    label: "Google Review",
    blurb: "A tap opens your review page, ready to write.",
    fieldLabel: "Review link",
    placeholder: "https://g.page/r/.../review",
  },
  {
    id: "pay",
    kind: "pay",
    label: "Payment",
    blurb: "A tap opens your payment link or page.",
    fieldLabel: "Payment link",
    placeholder: "https://...",
  },
  {
    id: "website",
    kind: "link",
    label: "Website",
    blurb: "A tap opens your website.",
    fieldLabel: "Website link",
    placeholder: "https://yoursite.com",
  },
  {
    id: "menu",
    kind: "menu",
    label: "Menu / Catalogue",
    blurb: "A tap opens your menu or catalogue.",
    fieldLabel: "Menu link",
    placeholder: "https://yourmenu.com",
  },
  {
    id: "file",
    kind: "link",
    label: "File",
    blurb: "A tap opens or downloads a file.",
    fieldLabel: "File link",
    placeholder: "https://.../file.pdf",
  },
  {
    id: "call",
    kind: "phone",
    label: "Call",
    blurb: "A tap opens the phone dialer.",
    fieldLabel: "Phone number",
    placeholder: "+92 300 1234567",
  },
  {
    id: "email",
    kind: "email",
    label: "Email",
    blurb: "A tap opens a new email to you.",
    fieldLabel: "Email address",
    placeholder: "you@example.com",
  },
  {
    id: "linkedin",
    kind: "linkedin",
    label: "LinkedIn",
    blurb: "A tap opens your LinkedIn profile.",
    fieldLabel: "LinkedIn link",
    placeholder: "https://linkedin.com/in/...",
  },
  {
    id: "tiktok",
    kind: "tiktok",
    label: "TikTok",
    blurb: "A tap opens your TikTok profile.",
    fieldLabel: "TikTok link",
    placeholder: "https://tiktok.com/@...",
  },
];

/**
 * The one-line "who you are" under the name: "Architect · Studio Nine".
 *
 * Layouts that only have room for a single line under the name were dropping
 * `company` on the floor — someone would fill the field in the editor and it
 * would appear nowhere. Joining is better than picking one: on a business card
 * the role and the firm are read together, and either half alone is fine.
 */
export function roleLine(card: Pick<CardProfile, "headline" | "company">): string | null {
  const parts = [card.headline, card.company].map((p) => p?.trim()).filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

// ---------------------------------------------------------------------------
// Colour contrast core.
//
// Every contrast decision in the public-card system — which text colour reads
// on a background, whether an accent needs nudging, whether a chosen surface
// keeps a template's own text legible — reduces to the same WCAG relative
// luminance. `normalizeHex` and `relativeLuminance` are that one calculation;
// everything below composes them rather than re-deriving channel math per
// function, which is how this used to have three near-identical copies of the
// same linearisation.
// ---------------------------------------------------------------------------

function normalizeHex(input: string | null | undefined): string | null {
  const hex = (input ?? "").replace("#", "").trim();
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  return full.length === 6 && /^[0-9a-fA-F]{6}$/.test(full) ? full : null;
}

function relativeLuminance(hex: string): number {
  const channel = (start: number) => {
    const v = parseInt(hex.slice(start, start + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** True past the point where white reads better than black on it — the same
 *  crossover readableOn() picks a colour at. Named so callers can reason
 *  about a colour's family ("is this actually dark") rather than repeating
 *  the luminance check inline. */
export function isDarkColor(hex: string | null | undefined): boolean {
  const full = normalizeHex(hex);
  return full ? relativeLuminance(full) <= 0.179 : false;
}

/** Linear channel blend toward `to`, `amount` of the way there (0 = `from`,
 *  1 = `to`). Used to derive secondary/muted/border tones from a resolved
 *  foreground and surface without hand-picking a second palette per state. */
export function mixHex(from: string, to: string, amount: number): string {
  const a = normalizeHex(from);
  const b = normalizeHex(to);
  if (!a || !b) return from;
  const t = Math.max(0, Math.min(1, amount));
  const channel = (start: number) => {
    const av = parseInt(a.slice(start, start + 2), 16);
    const bv = parseInt(b.slice(start, start + 2), 16);
    return Math.round(av + (bv - av) * t)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

/**
 * Black or white, whichever is legible on `background`.
 *
 * Users pick any accent they like, so templates that print text *on* the accent
 * can't hardcode white — a pale accent like #22D3EE leaves white text unreadable.
 * Uses WCAG relative luminance.
 */
export function readableOn(background: string | null | undefined): string {
  const full = normalizeHex(background ?? "#111111");
  if (!full) return "#FFFFFF";
  // 0.179 is the crossover where white and black contrast equally.
  return relativeLuminance(full) > 0.179 ? "#0A0A0A" : "#FFFFFF";
}

/**
 * The accent, nudged until it is legible as text on a given surface.
 *
 * Templates print the headline and small labels in the user's accent. That
 * works for a mid-tone, and fails at both ends: acid green on a white card, or
 * near-black on a dark one, is text you cannot read. People pick those colours
 * — they are in our own preset list — so the template has to cope rather than
 * assume a sensible choice.
 *
 * Only the lightness moves; the hue is what they chose and is left alone.
 *
 * `surface` is either the template's own assumed family (`"light"` | `"dark"`,
 * the original call shape — every existing call site keeps working exactly as
 * before) or an actual resolved background colour. The fixed-family form
 * approximates paper as pure white/near-black; passing the real colour instead
 * is what lets an accent stay legible against a surface the owner actually
 * chose, not just the template's design-time assumption. See resolveCardTheme.
 */
export function accentOn(accent: string, surface: "light" | "dark" | string): string {
  const full = normalizeHex(accent);
  if (!full) return accent;

  let [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));

  const lum = () => relativeLuminance([r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""));

  const resolvedSurfaceHex = surface === "light" || surface === "dark" ? null : normalizeHex(surface);
  const paper =
    resolvedSurfaceHex !== null
      ? relativeLuminance(resolvedSurfaceHex)
      : surface === "light"
        ? 1
        : 0.0086; // #ffffff vs #0a0a0a
  const goingLight = paper > 0.179 ? false : true; // stepping away from a light paper darkens; away from dark lightens
  const contrast = () => {
    const [hi, lo] = [lum(), paper].sort((a, z) => z - a);
    return (hi + 0.05) / (lo + 0.05);
  };

  // Step toward the opposite end until it reads. 4.5 is the text threshold;
  // stop at 3 so a mid accent keeps its character instead of being crushed.
  const target = 3;
  for (let i = 0; i < 24 && contrast() < target; i++) {
    if (goingLight) {
      r = Math.round(r + (255 - r) * 0.14);
      g = Math.round(g + (255 - g) * 0.14);
      b = Math.round(b + (255 - b) * 0.14);
    } else {
      r = Math.round(r * 0.88);
      g = Math.round(g * 0.88);
      b = Math.round(b * 0.88);
    }
  }

  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

/**
 * What a template is actually rendering against, resolved once and reused for
 * every text/border/icon decision inside it.
 *
 * The bug this exists to close: templates hardcode a text colour for the
 * family they were designed in (light or dark paper), and `accentOn` was
 * always asked about that same assumed family — so a custom `surface_color`
 * from outside that family (reachable through the editor's free colour
 * picker) could leave heading text, and separately accent-coloured text,
 * unreadable even though the background itself updates correctly. This
 * computes the real resolved surface once and derives every text tone from
 * *its* actual luminance instead of the template's design-time guess.
 *
 * Nothing here invents a second colour system: `surface` is the same value
 * `renderCardTemplate()` already wraps the template in (`card.surface_color`
 * falling back to the template's native tone), and every derived tone comes
 * from `readableOn`/`accentOn`/`mixHex` — the existing helpers, just fed the
 * resolved colour instead of a fixed assumption.
 */
export type CardTheme = {
  /** The background actually behind the template right now. */
  surface: string;
  /** Real luminance family of `surface` — not the template's assumed one. */
  dark: boolean;
  /** Heading/primary body colour. */
  fg: string;
  /** Secondary text — still clearly legible, quieter than fg. */
  fgDim: string;
  /** Muted labels/captions — the lightest text still meant to be read. */
  fgMuted: string;
  /** Hairline border/divider tone derived from the same foreground. */
  border: string;
  /** The owner's chosen accent, unchanged. */
  accent: string;
  /** The accent, nudged for legibility as *text* against the resolved surface. */
  accentText: string;
  /** Black or white, whichever reads on a solid accent fill (buttons). */
  onAccent: string;
};

export function resolveCardTheme(
  card: Pick<CardProfile, "surface_color" | "accent_color">,
  nativeSurface: string
): CardTheme {
  const surface = card.surface_color?.trim() || nativeSurface;
  const dark = isDarkColor(surface);
  const fg = readableOn(surface);
  const accent = card.accent_color || "#111111";

  return {
    surface,
    dark,
    fg,
    fgDim: mixHex(fg, surface, 0.28),
    fgMuted: mixHex(fg, surface, 0.52),
    border: mixHex(fg, surface, 0.84),
    accent,
    accentText: accentOn(accent, surface),
    onAccent: readableOn(accent),
  };
}

/** Drops rows the user hasn't filled in, so templates never map over blanks. */
export function resolveGallery(gallery: unknown): GalleryItem[] {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .filter((item): item is GalleryItem => Boolean(item?.url?.trim()))
    .map((item) => ({
      url: item.url.trim(),
      caption: item.caption?.trim() || undefined,
      href: item.href?.trim() || undefined,
    }));
}

export function initialsOf(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Carrd's discipline: one display face, one body face. */
export const FONT_STACKS: Record<string, string> = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), ui-monospace, 'SF Mono', monospace",
};

export function fontStack(font: string | null | undefined): string {
  return FONT_STACKS[font ?? "sans"] ?? FONT_STACKS.sans;
}

/**
 * Sectors, in the order they appear in the gallery.
 * Mirrors how Carrd splits its library — people arrive knowing what kind of
 * page they want before they know what it should look like.
 */
export const TEMPLATE_CATEGORIES = [
  {
    id: "profile",
    name: "Profile",
    blurb: "One screen, all your links. The classic tap-and-share card.",
  },
  {
    id: "landing",
    name: "Landing",
    blurb: "Sell one thing. A headline, a promise, one button.",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    blurb: "Lead with the work. Grids and galleries.",
  },
  {
    id: "sectioned",
    name: "Sectioned",
    blurb: "A whole site on one page, with jump links.",
  },
  {
    id: "form",
    name: "Form",
    blurb: "Built to get a reply. Contact front and centre.",
  },
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]["id"];

/**
 * `preview` is the accent the gallery demos each template with — picked per
 * template so the grid reads as distinct looks rather than one in N colours,
 * and chosen to stay legible on that template's background.
 *
 * These were re-derived after measuring what the gallery tiles actually render
 * as, rather than what the hex list says. The old set had 21 of 36 templates
 * sharing an exact hex with another (#7C3AED was doing duty for three), ten
 * crowded into the 5-45 degree warm band, and nothing at all between 80 and
 * 144 or between 270 and 334. It read as four colours, not thirty-six.
 *
 * The current set: every template a distinct accent, hues spread so the widest
 * gap on the wheel is 20 degrees, and neighbours in the gallery grid always
 * far apart in hue. Three rules shape the rest, each of which the contact
 * sheet caught by eye before it was understood:
 *
 *   - Lightness follows the template's own background — deep on paper, light
 *     and vivid on the dark ones — and is searched per hue rather than fixed,
 *     because sRGB holds very different amounts of chroma at different hues.
 *     A fixed lightness gave washed-out pastel violets and muddy olive yellows
 *     at the same time.
 *   - Hues from 85 to 140 are reserved for templates that render dark. Yellow
 *     and yellow-green cannot be both dark enough to read on white and clean;
 *     they go olive. Rust and amber below 85 are fine on paper, which is why
 *     the warm-paper templates still live there.
 *   - Five accents are held fixed because the colour is the template: sticker's
 *     acid (the product's own brand colour), neon's pink glow, glass's cyan
 *     frost, mono's terminal green, and contactsheet's darkroom grey — the one
 *     deliberately desaturated accent, which any even spread turns pink.
 */
export const CARD_TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Centred, airy, thin type. The safe default.",
    category: 'profile',
    vibe: "clean",
    preview: "#EB2974",
  },
  {
    id: "bold",
    name: "Bold",
    blurb: "Oversized display name, left aligned, filled buttons.",
    category: 'profile',
    vibe: "loud",
    preview: "#0B23EE",
  },
  {
    id: "split",
    name: "Split",
    blurb: "Accent panel up top, content below.",
    category: 'profile',
    vibe: "classic",
    preview: "#249971",
  },
  {
    id: "glass",
    name: "Glass",
    blurb: "Dark, frosted, glowing accent.",
    category: 'profile',
    vibe: "dark",
    preview: "#22D3EE",
  },
  {
    id: "mono",
    name: "Mono",
    blurb: "Monospace and understated. Technical.",
    category: 'profile',
    vibe: "dev",
    preview: "#4ADE80",
  },
  {
    id: "sticker",
    name: "Sticker",
    blurb: "Chunky borders, hard shadows, zero subtlety.",
    category: 'profile',
    vibe: "loud",
    preview: "#CCFF00",
  },
  {
    id: "aurora",
    name: "Aurora",
    blurb: "Full-bleed gradient that never sits still.",
    category: 'profile',
    vibe: "dark",
    preview: "#85E937",
  },
  {
    id: "editorial",
    name: "Editorial",
    blurb: "Serif, warm paper, magazine spread.",
    category: 'profile',
    vibe: "clean",
    preview: "#C56C21",
  },
  {
    id: "neon",
    name: "Neon",
    blurb: "Pure black and glowing outlines. After dark.",
    category: 'profile',
    vibe: "dark",
    preview: "#FF3D9A",
  },
  {
    id: "tape",
    name: "Tape",
    blurb: "Scrapbook energy. Tilted, taped, handmade.",
    category: 'profile',
    vibe: "loud",
    preview: "#B6711F",
  },

  // ---- Landing ----
  {
    id: "pitch",
    name: "Pitch",
    blurb: "One promise, one button. Built to convert.",
    category: 'landing',
    vibe: "loud",
    preview: "#EBC835",
  },
  {
    id: "waitlist",
    name: "Waitlist",
    blurb: "Coming soon, with a sign-up front and centre.",
    category: 'landing',
    vibe: "dark",
    preview: "#ABDC35",
  },

  {
    id: "poster",
    name: "Poster",
    blurb: "Full-bleed photo, huge type over it. Event energy.",
    category: 'landing',
    vibe: "loud",
    preview: "#F9C134",
  },
  {
    id: "app",
    name: "App",
    blurb: "Product shot, feature list, download button.",
    category: 'landing',
    vibe: "clean",
    preview: "#7F27F0",
  },

  // ---- Portfolio ----
  {
    id: "grid",
    name: "Grid",
    blurb: "Work first. A tight gallery of everything you've shipped.",
    category: 'portfolio',
    vibe: "clean",
    preview: "#249595",
  },
  {
    id: "showcase",
    name: "Showcase",
    blurb: "Big imagery, captions, gallery energy.",
    category: 'portfolio',
    vibe: "dark",
    preview: "#C5D334",
  },

  {
    id: "reel",
    name: "Reel",
    blurb: "Edge-to-edge photos, one after another.",
    category: 'portfolio',
    vibe: "dark",
    preview: "#D8CC34",
  },

  // ---- Sectioned ----
  {
    id: "stack",
    name: "Stack",
    blurb: "Hero, about, links, contact — with jump nav.",
    category: 'sectioned',
    vibe: "classic",
    preview: "#CF2ADB",
  },
  {
    id: "agency",
    name: "Agency",
    blurb: "Cover photo, services, work, contact. A small site.",
    category: 'sectioned',
    vibe: "dark",
    preview: "#32C2F0",
  },

  // ---- Form ----
  {
    id: "reply",
    name: "Reply",
    blurb: "A real contact form, above everything else.",
    category: 'form',
    vibe: "clean",
    preview: "#E62A8D",
  },
  {
    id: "booking",
    name: "Booking",
    blurb: "Pick a slot, leave details. For appointments.",
    category: 'form',
    vibe: "classic",
    preview: "#2085F3",
  },
  // Icon-only. Labels are what make a link list long, and face to face nobody
  // reads them — the glyph is recognised faster than the word.
  {
    id: "orbit",
    name: "Orbit",
    blurb: "Icon-only links under your photo. No labels at all.",
    category: 'profile',
    vibe: "icons",
    preview: "#F62E38",
  },
  {
    id: "tiles",
    name: "Tiles",
    blurb: "Icon-only links as a grid of big square tiles.",
    category: 'profile',
    vibe: "icons",
    preview: "#269E5F",
  },
  {
    id: "dock",
    name: "Dock",
    blurb: "Full-bleed photo, icon links docked where your thumb is.",
    category: 'profile',
    vibe: "icons",
    preview: "#7E6DF4",
  },
  {
    id: "masonry",
    name: "Masonry",
    blurb: "Staggered columns. Images keep their own shape.",
    category: 'portfolio',
    vibe: "papers",
    preview: "#C22BF5",
  },
  {
    id: "filmstrip",
    name: "Filmstrip",
    blurb: "Swipe sideways, one piece at a time.",
    category: 'portfolio',
    vibe: "cinematic",
    preview: "#3BD9F9",
  },
  {
    id: "lookbook",
    name: "Lookbook",
    blurb: "Full-bleed. The work fills the screen.",
    category: 'portfolio',
    vibe: "editorial",
    preview: "#F52CB5",
  },
  {
    id: "contactsheet",
    name: "Contact sheet",
    blurb: "Small, dense, numbered. Shows volume.",
    category: 'portfolio',
    vibe: "analogue",
    preview: "#374151",
  },
  {
    id: "case",
    name: "Case study",
    blurb: "Numbered steps with captions that explain.",
    category: 'portfolio',
    vibe: "considered",
    preview: "#228DD6",
  },
  {
    id: "mosaic",
    name: "Mosaic",
    blurb: "Mixed tile sizes so the grid has rhythm.",
    category: 'portfolio',
    vibe: "dark",
    preview: "#F32D5B",
  },
  {
    id: "frames",
    name: "Frames",
    blurb: "Prints laid on a table, slightly tilted.",
    category: 'portfolio',
    vibe: "warm",
    preview: "#D25F20",
  },
  {
    id: "menu",
    name: "Menu",
    blurb: "A price list with dotted leaders.",
    category: 'landing',
    vibe: "classic",
    preview: "#4328F2",
  },
  {
    id: "launch",
    name: "Launch",
    blurb: "One headline, one enormous button.",
    category: 'landing',
    vibe: "loud",
    preview: "#3CE5C2",
  },
  {
    id: "studio",
    name: "Studio",
    blurb: "Jump links, work, contact. A small site.",
    category: 'sectioned',
    vibe: "clean",
    preview: "#9F27F3",
  },
  {
    id: "journal",
    name: "Journal",
    blurb: "Serif and long-form, like a column.",
    category: 'sectioned',
    vibe: "literary",
    preview: "#E44920",
  },
  {
    id: "quote",
    name: "Quote",
    blurb: "Tells them exactly what to send you.",
    category: 'form',
    vibe: "practical",
    preview: "#24939E",
  },
  {
    id: "badge",
    name: "Badge",
    blurb: "A squared photo, a colour band, links as a printed detail sheet.",
    category: 'profile',
    vibe: "corporate",
    preview: "#2C4F96",
  },
  {
    id: "summit",
    name: "Summit",
    blurb: "Dark and serif, restrained. For when the title does the talking.",
    category: 'profile',
    vibe: "executive",
    preview: "#285D44",
  },
  {
    id: "flare",
    name: "Flare",
    blurb: "Big bio, a pill for every link, a gradient behind it all.",
    category: 'profile',
    vibe: "creator",
    preview: "#D04CF0",
  },
] as const;

export const TEMPLATE_IDS = CARD_TEMPLATES.map((t) => t.id);
