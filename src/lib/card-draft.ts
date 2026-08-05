import type { CardButton, CardProfile, GalleryItem } from "@/lib/card";

/** The editable shape of a card, shared by the public and dashboard editors. */
export type CardForm = {
  username: string;
  full_name: string;
  headline: string;
  company: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
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
  location: "",
  accent_color: "#111111",
  template: "minimal",
  font: "sans",
};

export type CardDraft = {
  form: CardForm;
  buttons: CardButton[];
  gallery?: GalleryItem[];
};

/**
 * Where an anonymous visitor's work lives until they have an account.
 *
 * People can design a whole card before signing up, so the draft has to survive
 * the trip through /login — localStorage does that, cookies would bloat every
 * request with the bio text.
 */
const DRAFT_KEY = "tapzar_card_draft";

export function saveDraft(draft: CardDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private mode / quota — the editor still works, it just won't persist.
  }
}

export function loadDraft(): CardDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CardDraft;
    if (!parsed?.form) return null;
    return {
      form: { ...EMPTY_CARD_FORM, ...parsed.form },
      buttons: Array.isArray(parsed.buttons) ? parsed.buttons : [],
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
    };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing useful to do.
  }
}

/** Builds the object the card templates expect from in-progress form state. */
export function draftToCardProfile(
  form: CardForm,
  buttons: CardButton[],
  gallery: GalleryItem[] = []
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
    cover_mode: "cover",
    gallery,
    location: form.location || null,
    whatsapp: buttons.find((b) => b.kind === "whatsapp")?.value ?? null,
    phone: buttons.find((b) => b.kind === "phone")?.value ?? null,
    email: buttons.find((b) => b.kind === "email")?.value ?? null,
    buttons,
    accent_color: form.accent_color,
    template: form.template,
    font: form.font,
    referral_code: null,
  };
}

/** Same rule as the CHECK constraint on card_profiles.username. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;
