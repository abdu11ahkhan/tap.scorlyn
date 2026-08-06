import "server-only";

/**
 * Outbound notifications.
 *
 * No email provider is configured yet, so nothing is actually sent. A database
 * trigger already queues a row in `notifications` whenever an order lands, and
 * the admin console reads that queue — so the record of "we owe this person an
 * email" exists from day one and nothing is lost in the meantime.
 *
 * To turn sending on later:
 *
 *   1. `npm i resend`, set RESEND_API_KEY and ORDER_ALERT_EMAIL.
 *   2. Fill in `deliver()` below.
 *   3. Call `drainNotifications()` from a cron route.
 *
 * Nothing above the queue needs to change — placing an order already works,
 * and it must not start failing because an email provider is down.
 */

export type QueuedNotification = {
  id: string;
  kind: string;
  subject: string;
  body: string;
};

/** Where order alerts go. Unset until a provider is wired up. */
export function alertRecipient(): string | null {
  return process.env.ORDER_ALERT_EMAIL?.trim() || null;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && alertRecipient());
}

/**
 * Send one notification.
 *
 * Returns an error string rather than throwing: a failed send is recorded
 * against the row and retried, never surfaced to whoever placed the order.
 */
export async function deliver(
  notification: QueuedNotification
): Promise<{ sent: boolean; error?: string }> {
  if (!emailConfigured()) {
    return { sent: false, error: "No email provider configured." };
  }

  // Provider call goes here. Left unimplemented on purpose rather than
  // half-written against an API key that doesn't exist yet.
  void notification;
  return { sent: false, error: "Email delivery not implemented yet." };
}
