"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  INVOICE_DISPLAY_OPTIONS,
  invoiceTotals,
  lineTotal,
  money,
  resolveDisplay,
  type InvoiceDisplay,
  type InvoiceItem,
} from "@/lib/invoice";
import type { InvoiceFields } from "../actions";

const FIELD =
  "w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-3.5 py-2.5 text-sm font-semibold text-sc-text placeholder:text-sc-text-dimmer focus-visible:border-acid focus-visible:outline-none";

const LABEL = "text-xs font-black uppercase tracking-[0.15em] text-sc-text-dimmer";

const BLANK_ITEM: InvoiceItem = { description: "", quantity: 1, unit_price_pkr: 0 };

export const EMPTY_INVOICE: InvoiceFields = {
  customer_name: "",
  customer_phone: null,
  customer_email: null,
  customer_address: null,
  issued_on: new Date().toISOString().slice(0, 10),
  due_on: null,
  items: [{ ...BLANK_ITEM }],
  discount_pkr: 0,
  shipping_pkr: 0,
  tax_percent: 0,
  notes: null,
  status: "unpaid",
  display: {},
};

/**
 * Writing an invoice.
 *
 * Totals are never typed — they come from the same helper the printed page
 * uses, so the figure someone is looking at while they edit is the figure
 * that gets printed. Typing a total by hand is how an invoice ends up
 * disagreeing with its own lines.
 */
export type CatalogueItem = { id: string; name: string; price_pkr: number };

export default function InvoiceEditor({
  initial,
  invoiceId,
  number,
  catalogue = [],
  onSave,
}: {
  initial: InvoiceFields;
  invoiceId?: string;
  number?: string;
  /** What you sell, so a line can be picked instead of typed. */
  catalogue?: CatalogueItem[];
  onSave: (fields: InvoiceFields) => Promise<{
    ok: boolean;
    error?: string;
    data?: { id: string };
  }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<InvoiceFields>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => invoiceTotals(form), [form]);
  const display = useMemo(() => resolveDisplay(form.display), [form.display]);

  const toggle = (key: keyof InvoiceDisplay) =>
    setForm((prev) => ({
      ...prev,
      display: { ...resolveDisplay(prev.display), [key]: !display[key] },
    }));

  const set = <K extends keyof InvoiceFields>(key: K, value: InvoiceFields[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setItem = (index: number, patch: Partial<InvoiceItem>) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));

  const submit = async () => {
    setSaving(true);
    setError(null);
    const result = await onSave(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save that.");
      return;
    }
    // Straight to the printable copy: making an invoice and then hunting for
    // it in a list is a step nobody wants.
    router.push(`/admin/invoices/${result.data?.id ?? invoiceId}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="app-h1">{invoiceId ? `Invoice ${number}` : "New invoice"}</h1>
          <p className="app-sub mt-1">
            {invoiceId
              ? "Changes are saved against the same invoice number."
              : "The number is issued when you save."}
          </p>
        </div>
        <Link href="/admin/invoices" className="app-pill inline-flex">
          all invoices
        </Link>
      </div>

      {error && (
        <p className="rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-4 py-3 text-sm font-bold text-sc-error">
          {error}
        </p>
      )}

      {/* ---------------- who it is for ---------------- */}
      <section className="app-panel app-panel-pad space-y-4">
        <h2 className={LABEL}>billed to</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Name</label>
            <input
              className={FIELD}
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              placeholder="Customer or company"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Phone</label>
            <input
              className={FIELD}
              value={form.customer_phone ?? ""}
              onChange={(e) => set("customer_phone", e.target.value)}
              placeholder="03xx xxxxxxx"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Email</label>
            <input
              className={FIELD}
              value={form.customer_email ?? ""}
              onChange={(e) => set("customer_email", e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Address</label>
            <input
              className={FIELD}
              value={form.customer_address ?? ""}
              onChange={(e) => set("customer_address", e.target.value)}
              placeholder="Street, city"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Issued</label>
            <input
              type="date"
              className={FIELD}
              value={form.issued_on}
              onChange={(e) => set("issued_on", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Due</label>
            <input
              type="date"
              className={FIELD}
              value={form.due_on ?? ""}
              onChange={(e) => set("due_on", e.target.value || null)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Status</label>
            <select
              className={FIELD}
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as InvoiceFields["status"])
              }
            >
              <option value="unpaid">unpaid</option>
              <option value="paid">paid</option>
              <option value="void">void</option>
            </select>
          </div>
        </div>
      </section>

      {/* ---------------- what they are paying for ---------------- */}
      <section className="app-panel app-panel-pad space-y-3">
        <h2 className={LABEL}>lines</h2>

        {form.items.map((item, index) => (
          <div key={index} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
            <div className="min-w-0 flex-1 space-y-1.5">
              {index === 0 && (
                <label className="text-xs font-bold text-sc-text-dim">Description</label>
              )}
              <input
                className={FIELD}
                value={item.description}
                onChange={(e) => setItem(index, { description: e.target.value })}
                placeholder="NFC cards — matte black, 50 pcs"
              />
            </div>
            <div className="w-20 space-y-1.5">
              {index === 0 && (
                <label className="text-xs font-bold text-sc-text-dim">Qty</label>
              )}
              <input
                type="number"
                min={0}
                className={FIELD}
                value={item.quantity}
                onChange={(e) =>
                  setItem(index, { quantity: Number(e.target.value) })
                }
              />
            </div>
            <div className="w-28 space-y-1.5">
              {index === 0 && (
                <label className="text-xs font-bold text-sc-text-dim">Unit Rs.</label>
              )}
              <input
                type="number"
                min={0}
                className={FIELD}
                value={item.unit_price_pkr}
                onChange={(e) =>
                  setItem(index, { unit_price_pkr: Number(e.target.value) })
                }
              />
            </div>
            <div className="w-28 shrink-0 space-y-1.5 text-right">
              {index === 0 && (
                <label className="block text-xs font-bold text-sc-text-dim">Line</label>
              )}
              <p className="py-2.5 text-sm font-black text-sc-text">
                {money(lineTotal(item))}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  // Never leave zero rows: an invoice with no line to type in
                  // looks broken.
                  items:
                    prev.items.length === 1
                      ? [{ ...BLANK_ITEM }]
                      : prev.items.filter((_, i) => i !== index),
                }))
              }
              aria-label="Remove line"
              className="mb-1 shrink-0 rounded-full p-2.5 text-sc-text-dimmer transition-colors hover:bg-sc-surface-2 hover:text-sc-error"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {catalogue.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-sc-border-soft pt-3">
            <span className="text-xs font-black uppercase tracking-[0.15em] text-sc-text-dimmer">
              add from catalogue
            </span>
            {catalogue.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() =>
                  setForm((prev) => {
                    const line = {
                      description: product.name,
                      quantity: 1,
                      unit_price_pkr: product.price_pkr,
                    };
                    // Fill the empty starter row rather than adding below it,
                    // otherwise every invoice begins with a blank line.
                    const blank = prev.items.findIndex(
                      (i) => !i.description.trim() && !i.unit_price_pkr
                    );
                    const items = [...prev.items];
                    if (blank === -1) items.push(line);
                    else items[blank] = line;
                    return { ...prev, items };
                  })
                }
                className="rounded-full border-2 border-sc-border px-3 py-1.5 text-xs font-bold text-sc-text transition-colors hover:border-acid hover:text-acid"
              >
                {product.name}
                <span className="ml-1.5 text-sc-text-dimmer">
                  {money(product.price_pkr)}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setForm((prev) => ({ ...prev, items: [...prev.items, { ...BLANK_ITEM }] }))
          }
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-acid hover:text-acid"
        >
          <Plus className="h-4 w-4" />
          add line
        </button>
      </section>

      {/* ---------------- what appears on it ---------------- */}
      <section className="app-panel app-panel-pad space-y-3">
        <div>
          <h2 className={LABEL}>on the invoice</h2>
          <p className="mt-1 text-sm font-semibold text-sc-text-dim">
            Switch off anything this customer does not need. A line with no
            value is left out either way.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {INVOICE_DISPLAY_OPTIONS.map((opt) => {
            const on = display[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                aria-pressed={on}
                className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-black lowercase transition-colors ${
                  on
                    ? "border-acid bg-acid/10 text-acid"
                    : "border-sc-border-soft text-sc-text-dimmer hover:border-sc-border"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------------- the money ---------------- */}
      <section className="app-panel app-panel-pad grid gap-5 sm:grid-cols-2">
        <div className="space-y-4">
          <h2 className={LABEL}>adjustments</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sc-text-dim">Discount</label>
              <input
                type="number"
                min={0}
                className={FIELD}
                value={form.discount_pkr}
                onChange={(e) => set("discount_pkr", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sc-text-dim">Delivery</label>
              <input
                type="number"
                min={0}
                className={FIELD}
                value={form.shipping_pkr}
                onChange={(e) => set("shipping_pkr", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sc-text-dim">Tax %</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={FIELD}
                value={form.tax_percent}
                onChange={(e) => set("tax_percent", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sc-text-dim">Notes</label>
            <textarea
              rows={3}
              className={FIELD}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Payment terms, bank details, thanks…"
            />
          </div>
        </div>

        {/* The same numbers the printed invoice will show, from the same
            function — so what is on screen while editing is what prints. */}
        <div className="space-y-2 self-start rounded-2xl border-2 border-sc-border-soft p-5">
          <Row label="Subtotal" value={money(totals.subtotal)} />
          {totals.discount > 0 && (
            <Row label="Discount" value={`− ${money(totals.discount)}`} />
          )}
          {totals.tax > 0 && (
            <Row label={`Tax (${form.tax_percent}%)`} value={money(totals.tax)} />
          )}
          {totals.shipping > 0 && (
            <Row label="Delivery" value={money(totals.shipping)} />
          )}
          <div className="mt-2 flex items-baseline justify-between border-t-2 border-sc-border-soft pt-3">
            <span className="text-sm font-black uppercase tracking-tight text-sc-text">
              Total
            </span>
            <span className="text-2xl font-black text-acid">
              {money(totals.total)}
            </span>
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid px-7 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {invoiceId ? "save & view" : "create invoice"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm font-semibold text-sc-text-dim">{label}</span>
      <span className="text-sm font-bold text-sc-text">{value}</span>
    </div>
  );
}
