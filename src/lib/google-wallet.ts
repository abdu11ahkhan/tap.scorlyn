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

/** Tolerates the usual paste slips: surrounding quotes, a trailing comma, stray spaces. */
const clean = (value: string | undefined) =>
  value?.trim().replace(/,$/, "").replace(/^["']|["']$/g, "").trim() || undefined;

const ISSUER_ID = clean(process.env.GOOGLE_WALLET_ISSUER_ID);
const SA_EMAIL = clean(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL);
// Vercel stores multi-line values fine, but a key pasted as one line keeps
// literal "\n" sequences — accept both.
const SA_KEY = clean(process.env.GOOGLE_WALLET_PRIVATE_KEY)?.replace(/\\n/g, "\n").replace(/\r/g, "");

/** Which variables are missing or unusable, by name only — never values. */
export function googleWalletProblem(): string | null {
  const missing = [
    !ISSUER_ID && "GOOGLE_WALLET_ISSUER_ID",
    !SA_EMAIL && "GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL",
    !SA_KEY && "GOOGLE_WALLET_PRIVATE_KEY",
  ].filter(Boolean);
  if (missing.length) return `missing ${missing.join(", ")}`;
  if (!SA_KEY!.includes("BEGIN PRIVATE KEY")) return "GOOGLE_WALLET_PRIVATE_KEY doesn't look like a PEM key";
  return null;
}

export function googleWalletEnabled(): boolean {
  return googleWalletProblem() === null;
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

/**
 * Bumped when every pass needs to be issued afresh. v2: passes saved while
 * the issuer account was in Google's demo mode carry a permanent "test"
 * label; new ids get passes issued in live mode.
 */
const PASS_VERSION = "v2";
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

function classIdFor(): string {
  return `${ISSUER_ID}.scorlyntap_card_${PASS_VERSION}`;
}

function buildPassObject(card: WalletCard, origin: string) {
  const cardUrl = `${origin}/u/${card.username}`;
  // Username in the id: a renamed handle gets a fresh pass with the new QR.
  const id = `${ISSUER_ID}.${safeId(`card_${PASS_VERSION}_${card.username}`)}`;
  const logo = httpsUrl(card.avatar_url) ?? `${origin}/logo-mark.png`;
  const name = card.full_name?.trim() || card.username;
  const subtitle = [card.headline, card.company].filter((v) => v?.trim()).join(" · ");

  return {
    id,
    classId: classIdFor(),
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
}

function signJwt(claims: object): string {
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(SA_KEY!);
  return `${unsigned}.${b64url(signature)}`;
}

/** OAuth token for the Wallet REST API, reused while it's still fresh. */
let token: { value: string; expires: number } | null = null;
async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt({
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Google Wallet token request failed");
  token = { value: json.access_token, expires: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return token.value;
}

/** Insert, or overwrite if it already exists — so the pass always shows the card as it is now. */
async function upsert(kind: "genericClass" | "genericObject", body: { id: string }, auth: string) {
  const headers = { authorization: `Bearer ${auth}`, "content-type": "application/json" };
  const put = await fetch(`${API}/${kind}/${encodeURIComponent(body.id)}`, { method: "PUT", headers, body: JSON.stringify(body) });
  if (put.ok) return;
  if (put.status !== 404) throw new Error(`Wallet ${kind} update failed (${put.status})`);
  const post = await fetch(`${API}/${kind}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!post.ok && post.status !== 409) throw new Error(`Wallet ${kind} insert failed (${post.status})`);
}

/**
 * Returns the pay.google.com save link, or null when Wallet isn't configured.
 *
 * The pass is written to Google first (class + object, via the REST API),
 * so a pass someone already saved updates on their phone when their card
 * changes — the save link alone can only insert, never update. If that call
 * fails, the link carries the whole pass instead, which still saves fine.
 */
export async function googleWalletSaveUrl(card: WalletCard, origin: string): Promise<string | null> {
  if (!ISSUER_ID || !SA_EMAIL || !SA_KEY) return null;

  const object = buildPassObject(card, origin);
  let synced = false;
  try {
    const auth = await accessToken();
    await upsert("genericClass", { id: object.classId }, auth);
    await upsert("genericObject", object, auth);
    synced = true;
  } catch (err) {
    console.error("google wallet sync failed, falling back to inline pass", err);
  }

  const jwt = signJwt({
    iss: SA_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [origin],
    payload: synced
      ? { genericObjects: [{ id: object.id, classId: object.classId }] }
      : { genericClasses: [{ id: object.classId }], genericObjects: [object] },
  });
  return `https://pay.google.com/gp/v/save/${jwt}`;
}
