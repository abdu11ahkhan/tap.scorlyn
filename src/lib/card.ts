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

export type CardButton = {
  label: string;
  kind: ButtonKind;
  value: string;
  /** Off keeps the link saved but hides it from the public card. */
  enabled?: boolean;
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
};

export type ResolvedButton = CardButton & { href: string; external: boolean };

/** Turns a stored button into something an <a> can use. */
export function resolveButton(button: CardButton): ResolvedButton | null {
  const value = (button.value ?? "").trim();
  if (!value) return null;

  const base = { ...button, label: button.label?.trim() || defaultLabel(button.kind) };

  switch (button.kind) {
    case "whatsapp": {
      const number = normalizeWhatsapp(value);
      return number ? { ...base, href: `https://wa.me/${number}`, external: true } : null;
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

function defaultLabel(kind: ButtonKind): string {
  return KIND_LABELS[kind] ?? "Link";
}

/**
 * Black or white, whichever is legible on `background`.
 *
 * Users pick any accent they like, so templates that print text *on* the accent
 * can't hardcode white — a pale accent like #22D3EE leaves white text unreadable.
 * Uses WCAG relative luminance.
 */

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
 */
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

export function accentOn(accent: string, surface: "light" | "dark"): string {
  const hex = accent.replace("#", "");
  const full =
    hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return accent;

  let [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

  const channel = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const lum = () => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const paper = surface === "light" ? 1 : 0.0086; // #ffffff vs #0a0a0a
  const contrast = () => {
    const [hi, lo] = [lum(), paper].sort((a, z) => z - a);
    return (hi + 0.05) / (lo + 0.05);
  };

  // Step toward the opposite end until it reads. 4.5 is the text threshold;
  // stop at 3 so a mid accent keeps its character instead of being crushed.
  const target = 3;
  for (let i = 0; i < 24 && contrast() < target; i++) {
    if (surface === "light") {
      r = Math.round(r * 0.88);
      g = Math.round(g * 0.88);
      b = Math.round(b * 0.88);
    } else {
      r = Math.round(r + (255 - r) * 0.14);
      g = Math.round(g + (255 - g) * 0.14);
      b = Math.round(b + (255 - b) * 0.14);
    }
  }

  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

export function readableOn(background: string | null | undefined): string {
  const hex = (background ?? "#111111").replace("#", "");
  const full =
    hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex.slice(0, 6);

  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) return "#FFFFFF";

  const channel = (start: number) => {
    const value = parseInt(full.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);

  // 0.179 is the crossover where white and black contrast equally.
  return luminance > 0.179 ? "#0A0A0A" : "#FFFFFF";
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
 */
export const CARD_TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Centred, airy, thin type. The safe default.",
    category: 'profile',
    vibe: "clean",
    preview: "#7C3AED",
  },
  {
    id: "bold",
    name: "Bold",
    blurb: "Oversized display name, left aligned, filled buttons.",
    category: 'profile',
    vibe: "loud",
    preview: "#FF3D9A",
  },
  {
    id: "split",
    name: "Split",
    blurb: "Accent panel up top, content below.",
    category: 'profile',
    vibe: "classic",
    preview: "#0F766E",
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
    preview: "#A855F7",
  },
  {
    id: "editorial",
    name: "Editorial",
    blurb: "Serif, warm paper, magazine spread.",
    category: 'profile',
    vibe: "clean",
    preview: "#B45309",
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
    preview: "#F59E0B",
  },

  // ---- Landing ----
  {
    id: "pitch",
    name: "Pitch",
    blurb: "One promise, one button. Built to convert.",
    category: 'landing',
    vibe: "loud",
    preview: "#CCFF00",
  },
  {
    id: "waitlist",
    name: "Waitlist",
    blurb: "Coming soon, with a sign-up front and centre.",
    category: 'landing',
    vibe: "dark",
    preview: "#8B5CF6",
  },

  {
    id: "poster",
    name: "Poster",
    blurb: "Full-bleed photo, huge type over it. Event energy.",
    category: 'landing',
    vibe: "loud",
    preview: "#F43F5E",
  },
  {
    id: "app",
    name: "App",
    blurb: "Product shot, feature list, download button.",
    category: 'landing',
    vibe: "clean",
    preview: "#2563EB",
  },

  // ---- Portfolio ----
  {
    id: "grid",
    name: "Grid",
    blurb: "Work first. A tight gallery of everything you've shipped.",
    category: 'portfolio',
    vibe: "clean",
    preview: "#0EA5E9",
  },
  {
    id: "showcase",
    name: "Showcase",
    blurb: "Big imagery, captions, gallery energy.",
    category: 'portfolio',
    vibe: "dark",
    preview: "#F43F5E",
  },

  {
    id: "reel",
    name: "Reel",
    blurb: "Edge-to-edge photos, one after another.",
    category: 'portfolio',
    vibe: "dark",
    preview: "#EAB308",
  },

  // ---- Sectioned ----
  {
    id: "stack",
    name: "Stack",
    blurb: "Hero, about, links, contact — with jump nav.",
    category: 'sectioned',
    vibe: "classic",
    preview: "#059669",
  },
  {
    id: "agency",
    name: "Agency",
    blurb: "Cover photo, services, work, contact. A small site.",
    category: 'sectioned',
    vibe: "dark",
    preview: "#F97316",
  },

  // ---- Form ----
  {
    id: "reply",
    name: "Reply",
    blurb: "A real contact form, above everything else.",
    category: 'form',
    vibe: "clean",
    preview: "#7C3AED",
  },
  {
    id: "booking",
    name: "Booking",
    blurb: "Pick a slot, leave details. For appointments.",
    category: 'form',
    vibe: "classic",
    preview: "#0D9488",
  },
  // Icon-only. Labels are what make a link list long, and face to face nobody
  // reads them — the glyph is recognised faster than the word.
  {
    id: "orbit",
    name: "Orbit",
    blurb: "Icon-only links under your photo. No labels at all.",
    category: 'profile',
    vibe: "icons",
    preview: "#22D3EE",
  },
  {
    id: "tiles",
    name: "Tiles",
    blurb: "Icon-only links as a grid of big square tiles.",
    category: 'profile',
    vibe: "icons",
    preview: "#F59E0B",
  },
  {
    id: "dock",
    name: "Dock",
    blurb: "Full-bleed photo, icon links docked where your thumb is.",
    category: 'profile',
    vibe: "icons",
    preview: "#EC4899",
  },
  {
    id: "masonry",
    name: "Masonry",
    blurb: "Staggered columns. Images keep their own shape.",
    category: 'portfolio',
    vibe: "papers",
    preview: "#0EA5E9",
  },
  {
    id: "filmstrip",
    name: "Filmstrip",
    blurb: "Swipe sideways, one piece at a time.",
    category: 'portfolio',
    vibe: "cinematic",
    preview: "#E11D48",
  },
  {
    id: "lookbook",
    name: "Lookbook",
    blurb: "Full-bleed. The work fills the screen.",
    category: 'portfolio',
    vibe: "editorial",
    preview: "#A16207",
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
    preview: "#1D4ED8",
  },
  {
    id: "mosaic",
    name: "Mosaic",
    blurb: "Mixed tile sizes so the grid has rhythm.",
    category: 'portfolio',
    vibe: "dark",
    preview: "#7C3AED",
  },
  {
    id: "frames",
    name: "Frames",
    blurb: "Prints laid on a table, slightly tilted.",
    category: 'portfolio',
    vibe: "warm",
    preview: "#B45309",
  },
  {
    id: "menu",
    name: "Menu",
    blurb: "A price list with dotted leaders.",
    category: 'landing',
    vibe: "classic",
    preview: "#166534",
  },
  {
    id: "launch",
    name: "Launch",
    blurb: "One headline, one enormous button.",
    category: 'landing',
    vibe: "loud",
    preview: "#DC2626",
  },
  {
    id: "studio",
    name: "Studio",
    blurb: "Jump links, work, contact. A small site.",
    category: 'sectioned',
    vibe: "clean",
    preview: "#0F766E",
  },
  {
    id: "journal",
    name: "Journal",
    blurb: "Serif and long-form, like a column.",
    category: 'sectioned',
    vibe: "literary",
    preview: "#7C2D12",
  },
  {
    id: "quote",
    name: "Quote",
    blurb: "Tells them exactly what to send you.",
    category: 'form',
    vibe: "practical",
    preview: "#0D9488",
  },
] as const;

export const TEMPLATE_IDS = CARD_TEMPLATES.map((t) => t.id);
