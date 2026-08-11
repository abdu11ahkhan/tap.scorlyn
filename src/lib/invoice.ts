/** One line on an invoice. */
export type InvoiceItem = {
  description: string;
  quantity: number;
  unit_price_pkr: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

export type InvoiceInput = {
  items: InvoiceItem[];
  discount_pkr: number;
  shipping_pkr: number;
  tax_percent: number;
};

/** A line's own total. Negative quantities and prices are treated as zero. */
export function lineTotal(item: InvoiceItem): number {
  const qty = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
  const price = Number.isFinite(item.unit_price_pkr)
    ? Math.max(0, item.unit_price_pkr)
    : 0;
  return Math.round(qty * price);
}

/**
 * Every number on an invoice, from its lines.
 *
 * Deliberately not stored on the row. A stored total drifts the moment a line
 * is corrected, and an invoice whose total disagrees with the rows printed
 * above it is worse than no invoice — so the editor and the printed page call
 * this same function rather than each doing their own arithmetic.
 *
 * Tax applies after the discount, which is the order that matches how these
 * are quoted here: a discount is off the goods, tax is on what is owed.
 */
export function invoiceTotals(input: InvoiceInput): InvoiceTotals {
  const subtotal = input.items.reduce((sum, item) => sum + lineTotal(item), 0);

  // Never more than the goods: a discount larger than the subtotal would
  // otherwise produce a negative bill.
  const discount = Math.min(
    Math.max(0, Math.round(input.discount_pkr || 0)),
    subtotal
  );
  const shipping = Math.max(0, Math.round(input.shipping_pkr || 0));
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * Math.max(0, input.tax_percent || 0)) / 100);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: taxable + tax + shipping,
  };
}

/** Rs.1,600 — grouped the way prices are written locally. */
export function money(amount: number): string {
  return `Rs.${Math.round(amount).toLocaleString("en-PK")}`;
}

/** Rows worth printing: a blank description with no price is just an empty row. */
export function usableItems(items: InvoiceItem[]): InvoiceItem[] {
  return items.filter(
    (item) => item.description?.trim() || lineTotal(item) > 0
  );
}


/**
 * Which parts of an invoice get printed.
 *
 * Not every invoice wants every field: a corporate batch billed to an account
 * has no use for a home address, a cash sale has no due date, and some jobs
 * are quoted as a single figure with no unit price broken out.
 */
export type InvoiceDisplay = {
  phone: boolean;
  email: boolean;
  address: boolean;
  due_date: boolean;
  quantity: boolean;
  unit_price: boolean;
  notes: boolean;
  footer: boolean;
};

export const INVOICE_DISPLAY_OPTIONS: {
  id: keyof InvoiceDisplay;
  label: string;
}[] = [
  { id: "phone", label: "phone" },
  { id: "email", label: "email" },
  { id: "address", label: "address" },
  { id: "due_date", label: "due date" },
  { id: "quantity", label: "qty column" },
  { id: "unit_price", label: "unit price column" },
  { id: "notes", label: "notes" },
  { id: "footer", label: "footer" },
];

const ALL_ON: InvoiceDisplay = {
  phone: true,
  email: true,
  address: true,
  due_date: true,
  quantity: true,
  unit_price: true,
  notes: true,
  footer: true,
};

/**
 * Missing keys mean on, so an invoice written before these toggles existed
 * prints exactly as it always did rather than losing half its fields.
 */
export function resolveDisplay(raw: unknown): InvoiceDisplay {
  const value = (raw ?? {}) as Partial<InvoiceDisplay>;
  return { ...ALL_ON, ...value };
}
