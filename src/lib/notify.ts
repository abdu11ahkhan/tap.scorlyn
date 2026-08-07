import "server-only";
import { mailerConfigured, sendNotice } from "./email";

/**
 * Outbound notifications.
 *
 * A database trigger queues a row in `notifications` whenever an order lands,
 * and the admin console reads that queue, so the record of "we owe this person
 * an email" survives whatever the mail provider is doing. Sending is drained
 * separately and never blocks placing an order.
 *
 * Delivery goes through the same SMTP transport as everything else rather than
 * a second provider SDK: mail already leaves as noreply@scorlyn.com through
 * Resend, and a second path would be a second thing to keep authenticated.
 */

export type QueuedNotification = {
  id: string;
  kind: string;
  subject: string;
  body: string;
};

/**
 * Where order alerts go. Falls back to the sending address, since an alert
 * that reaches the company inbox is better than one dropped for want of a
 * variable nobody set.
 */
export function alertRecipient(): string | null {
  return (
    process.env.ORDER_ALERT_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    null
  );
}

export function emailConfigured(): boolean {
  return mailerConfigured() && Boolean(alertRecipient());
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
  const to = alertRecipient();
  if (!emailConfigured() || !to) {
    return { sent: false, error: "No email provider configured." };
  }

  try {
    await sendNotice(to, notification.subject, notification.body);
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
