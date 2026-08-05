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
      return "bg-acid text-ink";
    case "shipped":
    case "printing":
      return "bg-violet-pop text-white";
    case "paid":
      return "bg-white text-ink";
    case "cancelled":
      return "bg-hotpink text-white";
    default:
      return "bg-white/15 text-white/70";
  }
}
