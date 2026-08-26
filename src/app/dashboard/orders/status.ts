/** The happy path, in order. `cancelled` sits outside it. */
export const STATUS_STEPS = ["pending", "paid", "printing", "shipped", "delivered"];

export const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Payment confirmed",
  printing: "Printing your card",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function statusTone(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-sc-success/15 text-sc-success";
    case "shipped":
    case "printing":
      return "bg-sc-warning/15 text-sc-warning";
    case "paid":
      return "bg-sc-gold/15 text-sc-gold-text";
    case "cancelled":
      return "bg-sc-error/15 text-sc-error";
    default:
      return "bg-sc-surface-2 text-sc-text-dim";
  }
}
