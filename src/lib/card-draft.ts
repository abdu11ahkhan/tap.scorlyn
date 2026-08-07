import type { CardButton, CardProfile, GalleryItem } from "@/lib/card";
import type { ExtrasState } from "@/components/card-editor/ProfileExtrasFields";
import { readStorage, removeStorage, writeStorage } from "@/lib/safe-storage";

/** The editable shape of a card, shared by the public and dashboard editors. */
export type CardForm = {
  username: string;
  full_name: string;
  headline: string;
  company: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  logo_url: string;
  show_qr: boolean;
  published: boolean;
  location: string;
  accent_color: string;
  template: string;
  font: string;
};

export const EMPTY_CARD_FORM: CardForm = {
  username: "",
  full_name: "",
  headline: "",
  company: "",
  bio: "",
  avatar_url: "",
  cover_url: "",
  logo_url: "",
  show_qr: true,
  published: true,
  location: "",
  accent_color: "#111111",
  template: "minimal",
  font: "sans",
};

export type CardDraft = {
  form: CardForm;
  buttons: CardButton[];
  gallery?: GalleryItem[];
  extras?: Partial<ExtrasState>;
};

/**
 * Where an anonymous visitor's work lives until they have an account.
 *
 * People can design a whole card before signing up, so the draft has to survive
 * the trip through /login — localStorage does that, cookies would bloat every
 * request with the bio text.
 */
const DRAFT_KEY = "scorlyntap_card_draft";
/** Pre-rename key. Read-only, so a card half-designed before the rename
 *  isn't thrown away on the visitor's next page load. */
const LEGACY_DRAFT_KEY = "tapzar_card_draft";

export function saveDraft(draft: CardDraft): void {
  writeStorage("local", DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): CardDraft | null {
  try {
    const raw =
      readStorage("local", DRAFT_KEY) ?? readStorage("local", LEGACY_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CardDraft;
    if (!parsed?.form) return null;
    return {
      form: { ...EMPTY_CARD_FORM, ...parsed.form },
      buttons: Array.isArray(parsed.buttons) ? parsed.buttons : [],
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
      extras: parsed.extras ?? {},
    };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  removeStorage("local", DRAFT_KEY);
  removeStorage("local", LEGACY_DRAFT_KEY);
}

/** Builds the object the card templates expect from in-progress form state. */
export function draftToCardProfile(
  form: CardForm,
  buttons: CardButton[],
  gallery: GalleryItem[] = [],
  extras?: Partial<ExtrasState>
): CardProfile {
  return {
    id: "preview",
    username: form.username || "your-name",
    full_name: form.full_name || "Your Name",
    headline: form.headline || null,
    company: form.company || null,
    bio: form.bio || null,
    avatar_url: form.avatar_url || null,
    cover_url: form.cover_url || null,
    logo_url: form.logo_url || null,
    show_qr: form.show_qr !== false,
    cover_mode: "cover",
    gallery,
    location: form.location || null,
    whatsapp: buttons.find((b) => b.kind === "whatsapp")?.value ?? null,
    phone: buttons.find((b) => b.kind === "phone")?.value ?? null,
    email: buttons.find((b) => b.kind === "email")?.value ?? null,
    buttons,
    available_for_work: extras?.available_for_work ?? false,
    availability_note: extras?.availability_note || null,
    business_hours: extras?.business_hours ?? [],
    video_url: extras?.video_url || null,
    background_style: "accent",
    payment_enabled: extras?.payment_enabled ?? false,
    payment_methods: extras?.payment_methods ?? [],
    view_count: 0,
    accent_color: form.accent_color,
    template: form.template,
    font: form.font,
    referral_code: null,
  };
}

/** Same rule as the CHECK constraint on card_profiles.username. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;
