import { createSign } from "node:crypto";

/**
 * "Save to Google Wallet" links for a card.
 *
 * Uses the JWT flow: the pass class and object travel inside a signed token,
 * so nothing has to be pre-created through the Wallet REST API — Google
 * inserts them the first time someone opens the link. Signed with the
 * service account's own RSA key via node:crypto, no SDK needed.
 *
 * The pass carries the card's QR (the same /u/<username> link the printed
 * QR opens). Wallet NFC ("Smart Tap") only talks to approved merchant
 * terminals, never phone-to-phone, so the physical card stays the tap.
 *
 * Server-only: reads the private key from the environment.
 */

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID?.trim();
const SA_EMAIL = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim();
// Vercel stores multi-line values fine, but a key pasted as one line keeps
// literal "\n" sequences — accept both.
const SA_KEY = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

export function googleWalletEnabled(): boolean {
  return Boolean(ISSUER_ID && SA_EMAIL && SA_KEY);
}

export type WalletCard = {
  username: string;
  full_name: string | null;
  headline?: string | null;
  company?: string | null;
  avatar_url?: string | null;
  accent_color?: string | null;
};

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/** Wallet ids allow letters, digits, ".", "_" and "-" only. */
const safeId = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

const text = (value: string) => ({ defaultValue: { language: "en-US", value } });

/** Wallet only accepts public https images; anything else falls back. */
const httpsUrl = (value: string | null | undefined) =>
  value && /^https:\/\//i.test(value) ? value : null;

const hexColor = (value: string | null | undefined) =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#169496";

/** Returns the pay.google.com save link, or null when Wallet isn't configured. */
export function googleWalletSaveUrl(card: WalletCard, origin: string): string | null {
  if (!ISSUER_ID || !SA_EMAIL || !SA_KEY) return null;

  const cardUrl = `${origin}/u/${card.username}`;
  const classId = `${ISSUER_ID}.scorlyntap_card`;
  // Username in the id: a renamed handle gets a fresh pass with the new QR
  // instead of silently reusing the old object (the JWT flow never updates
  // an existing one).
  const objectId = `${ISSUER_ID}.${safeId(`card_${card.username}`)}`;
  const logo = httpsUrl(card.avatar_url) ?? `${origin}/logo-mark.png`;
  const name = card.full_name?.trim() || card.username;
  const subtitle = [card.headline, card.company].filter((v) => v?.trim()).join(" · ");

  const genericObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    cardTitle: text("ScorlynTap"),
    header: text(name),
    ...(subtitle ? { subheader: text(subtitle.slice(0, 80)) } : {}),
    logo: { sourceUri: { uri: logo }, contentDescription: text(name) },
    hexBackgroundColor: hexColor(card.accent_color),
    barcode: {
      type: "QR_CODE",
      value: cardUrl,
      alternateText: cardUrl.replace(/^https?:\/\//, ""),
    },
    textModulesData: [
      { id: "how", header: "Share it", body: "Let them scan this QR — your card opens on their phone, no app needed." },
    ],
    linksModuleData: {
      uris: [{ uri: cardUrl, description: "Open my card", id: "card" }],
    },
  };

  const claims = {
    iss: SA_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [origin],
    payload: {
      genericClasses: [{ id: classId }],
      genericObjects: [genericObject],
    },
  };

  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(SA_KEY);
  return `https://pay.google.com/gp/v/save/${unsigned}.${b64url(signature)}`;
}
