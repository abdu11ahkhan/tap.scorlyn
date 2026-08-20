"use client";

/**
 * Fires a card interaction event at /api/tap. Every caller (SaveContact,
 * ShareButton, CardQr, OutboundClickTracker) uses this instead of its own
 * fetch, so the "never block, never throw, never await" contract lives in
 * one place. Never call this before letting the real action (a tel:/
 * mailto: navigation, a native share, a vCard download) proceed — it's
 * fire-and-forget by design and must never be the thing a visitor waits on.
 */
export type TrackedEvent =
  | "contact_save"
  | "share"
  | "qr_open"
  | "phone_click"
  | "email_click"
  | "whatsapp_click"
  | "website_click"
  | "social_click"
  | "booking_click";

export function trackCardEvent(
  username: string,
  eventType: TrackedEvent,
  target?: string | null,
  nfcCode?: string | null
): void {
  if (!username) return;
  fetch("/api/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      eventType,
      target: target || undefined,
      nfcCode: nfcCode || undefined,
    }),
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the card.
  });
}
