import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * Sends whatever is waiting in the queue.
 *
 * The queue exists so that placing an order never depends on mail working; the
 * cost is that something has to come along afterwards and empty it. Each row
 * is claimed before sending, so two overlapping ticks cannot both send it, and
 * a failure records the reason and leaves the row for the next run.
 */
export async function drainNotifications(
  supabase: SupabaseClient,
  max = 20
): Promise<{ sent: number; failed: number }> {
  if (!emailConfigured()) return { sent: 0, failed: 0 };

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, subject, body")
    .is("sent_at", null)
    .order("created_at")
    .limit(max);

  const rows = (data ?? []) as QueuedNotification[];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    // Claimed first: two ticks overlapping would otherwise both send it.
    const { data: claimed } = await supabase
      .from("notifications")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("sent_at", null)
      .select("id");

    if (!Array.isArray(claimed) || claimed.length === 0) continue;

    const result = await deliver(row);

    if (result.sent) {
      sent += 1;
    } else {
      failed += 1;
      // Released, with the reason, so the next run tries again rather than
      // silently marking an unsent alert as done.
      await supabase
        .from("notifications")
        .update({ sent_at: null, error: result.error ?? "unknown" })
        .eq("id", row.id)
        .is("sent_at", null)
        .select("id");
    }
  }

  return { sent, failed };
}
