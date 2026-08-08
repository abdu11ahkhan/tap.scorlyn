import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { Safepay } from "@sfpy/node-sdk";

/**
 * Safepay checkout.
 *
 * The URLs come from Safepay's own SDK rather than being written out here. An
 * earlier version built them by hand from a published integration guide and
 * pointed at /components, which Safepay has since retired — it now answers
 * with a redirect to their marketing site, so the customer would have been
 * sent to a page that could not take payment. The SDK tracks that path.
 *
 * Two keys, and they are not interchangeable: the API key identifies the
 * merchant when opening a session, while the secret only ever verifies
 * webhooks and must never leave the server.
 */
/**
 * The SDK types this as an enum, but the enum is not exported from the package
 * root. Deriving it from the constructor keeps the two in step without
 * reaching into dist/ for an internal path that a patch release could move.
 */
type SafepayEnv = ConstructorParameters<typeof Safepay>[0]["environment"];

const ENV = (process.env.SAFEPAY_ENV === "production"
  ? "production"
  : "sandbox") as SafepayEnv;

const API_KEY = process.env.SAFEPAY_API_KEY?.trim();
const SECRET = process.env.SAFEPAY_SECRET_KEY?.trim();

export function safepayConfigured(): boolean {
  return Boolean(API_KEY && SECRET);
}

/** What is missing, so the console can say so rather than just failing. */
export function safepayMissing(): string[] {
  return [
    !API_KEY ? "SAFEPAY_API_KEY" : null,
    !SECRET ? "SAFEPAY_SECRET_KEY" : null,
  ].filter(Boolean) as string[];
}

function client() {
  if (!API_KEY || !SECRET) {
    throw new Error("Safepay is not configured on this server.");
  }
  return new Safepay({
    environment: ENV,
    apiKey: API_KEY,
    v1Secret: SECRET,
    webhookSecret: SECRET,
  });
}

/**
 * Opens a checkout session and returns where to send the customer.
 *
 * The amount is in rupees, not paisa — Safepay takes the major unit here, and
 * sending 160000 for a Rs.1,600 order would charge a hundred times the price.
 */
export async function createCheckout(opts: {
  amountPkr: number;
  orderRef: string;
  redirectUrl: string;
  cancelUrl: string;
}): Promise<{ tracker: string; url: string }> {
  const safepay = client();

  const { token } = await safepay.payments.create({
    amount: opts.amountPkr,
    currency: "PKR",
  });

  const url = safepay.checkout.create({
    token,
    orderId: opts.orderRef,
    cancelUrl: opts.cancelUrl,
    redirectUrl: opts.redirectUrl,
    source: "custom",
    // Asks Safepay to call our webhook, which is the only thing that marks an
    // order paid. Without it the money arrives and the order never moves.
    webhooks: true,
  });

  return { tracker: token, url };
}

/**
 * Is this webhook really from Safepay?
 *
 * The signature is HMAC-SHA256 of the tracker under our secret. Compared in
 * constant time: a plain === leaks how much of a forged signature was correct,
 * which is enough to guess the rest a byte at a time.
 */
export function verifySignature(tracker: string, signature: string): boolean {
  if (!SECRET || !tracker || !signature) return false;

  const expected = createHmac("sha256", SECRET).update(tracker).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");

  // timingSafeEqual throws on a length mismatch rather than returning false.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
