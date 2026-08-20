/**
 * Physical card lifecycle — derived, not stored.
 *
 * Two systems that were never linked at the database level: order
 * fulfillment (orders.status) and NFC hardware assignment (nfc_cards rows
 * sharing the order's card_profile_id). Neither table has a foreign key to
 * the other. This module derives one honest customer-facing timeline from
 * both, without inventing a merged status column.
 *
 * One state the schema genuinely can't tell apart: "assigned" and "ready to
 * tap" are the same database fact (a nfc_cards row exists with this
 * card_profile_id) — there is no separate readiness signal, so they are one
 * step here, not two. "First tap received" is real and distinct: it's the
 * earliest card_taps row recorded against that specific nfc_card_id.
 */

export type PhysicalStepKey =
  | "ordered"
  | "payment"
  | "printing"
  | "shipped"
  | "delivered"
  | "assigned"
  | "active";

export type PhysicalStep = {
  key: PhysicalStepKey;
  label: string;
  done: boolean;
  current: boolean;
};

export type NfcAssignment = {
  nfcCardId: string;
  firstTapAt: string | null;
};

export type PhysicalCardStatus = {
  orderId: string;
  reference: string;
  orderStatus: string;
  cancelled: boolean;
  steps: PhysicalStep[];
  assignments: NfcAssignment[];
  headline: string;
  nextAction: { label: string; href?: string } | null;
};

export function buildPhysicalCardStatus(input: {
  order: { id: string; reference: string; status: string };
  assignments: NfcAssignment[];
}): PhysicalCardStatus {
  const { order, assignments } = input;
  const status = order.status;
  const cancelled = status === "cancelled";

  const paymentDone = !cancelled && status !== "pending";
  const printingDone = !cancelled && ["printing", "shipped", "delivered"].includes(status);
  const shippedDone = !cancelled && ["shipped", "delivered"].includes(status);
  const deliveredDone = !cancelled && status === "delivered";
  const assignedDone = assignments.length > 0;
  const firstTapAt = assignments.map((a) => a.firstTapAt).filter(Boolean).sort()[0] ?? null;
  const activeDone = firstTapAt !== null;

  const steps: { key: PhysicalStepKey; label: string; done: boolean }[] = [
    { key: "ordered", label: "Order confirmed", done: !cancelled },
    { key: "payment", label: "Payment received", done: paymentDone },
    { key: "printing", label: "Being printed", done: printingDone },
    { key: "shipped", label: "Shipped", done: shippedDone },
    { key: "delivered", label: "Delivered", done: deliveredDone },
    { key: "assigned", label: "NFC card ready to tap", done: assignedDone },
    { key: "active", label: "First tap received", done: activeDone },
  ];

  const firstNotDoneIndex = steps.findIndex((s) => !s.done);
  const withCurrent: PhysicalStep[] = steps.map((s, i) => ({
    ...s,
    current: !cancelled && i === firstNotDoneIndex,
  }));

  let headline: string;
  let nextAction: PhysicalCardStatus["nextAction"] = null;

  if (cancelled) {
    headline = "This order was cancelled.";
  } else if (!paymentDone) {
    headline = "Awaiting your payment.";
    nextAction = { label: "Send your payment proof", href: `/dashboard/orders/${order.id}` };
  } else if (!printingDone) {
    headline = "Payment received — being printed next.";
  } else if (!shippedDone) {
    headline = "Being printed.";
  } else if (!deliveredDone) {
    headline = "On its way.";
  } else if (!assignedDone) {
    headline = "Delivered — we're linking it to your digital card.";
  } else if (!activeDone) {
    headline = "Ready — tap it on a phone to activate it.";
    nextAction = { label: "How to tap your card", href: "/dashboard/nfc" };
  } else {
    headline = "Active — your physical card has been tapped.";
  }

  return {
    orderId: order.id,
    reference: order.reference,
    orderStatus: status,
    cancelled,
    steps: withCurrent,
    assignments,
    headline,
    nextAction,
  };
}

/** Compact one-line label for list rows / the dashboard widget. */
export function physicalCardShortLabel(s: PhysicalCardStatus): string {
  if (s.cancelled) return "Cancelled";
  if (s.orderStatus === "pending") return "Payment pending";
  if (s.orderStatus === "paid") return "Payment confirmed";
  if (s.orderStatus === "printing") return "Being printed";
  if (s.orderStatus === "shipped") return "Shipped";
  if (s.assignments.length === 0) return "Delivered — assignment pending";
  const tapped = s.assignments.some((a) => a.firstTapAt);
  return tapped ? "Active" : "Ready to tap";
}
