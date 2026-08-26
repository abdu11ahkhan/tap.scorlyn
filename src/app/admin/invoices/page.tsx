import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { invoiceTotals, money, type InvoiceItem } from "@/lib/invoice";
import ActionButton from "../ActionButton";
import { deleteInvoice } from "../actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  number: string;
  customer_name: string;
  issued_on: string;
  status: string;
  items: InvoiceItem[];
  discount_pkr: number;
  shipping_pkr: number;
  tax_percent: number;
};

export default async function AdminInvoices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, number, customer_name, issued_on, status, items, discount_pkr, shipping_pkr, tax_percent"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const invoices = (data ?? []) as Row[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="app-h1">Invoices</h1>
          <p className="app-sub mt-1">
            Bill anything — bulk card runs, design work, a corporate batch.
          </p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="app-btn app-btn-primary"
        >
          <Plus className="h-4 w-4" />
          new invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="app-panel app-panel-pad text-center">
          <FileText className="mx-auto h-8 w-8 text-sc-text-dimmer" />
          <p className="mt-3 text-sm font-black text-sc-text">No invoices yet</p>
          <p className="mt-1 text-sm font-semibold text-sc-text-dim">
            The first one you write gets number INV-{new Date().getFullYear()}-0001.
          </p>
        </div>
      ) : (
        <div className="app-panel overflow-x-auto">
          <table className="app-table w-full">
            <thead className="border-b border-sc-border-soft">
              <tr>
                <th>Invoice</th>
                <th>Billed to</th>
                <th>Issued</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                // The same helper the invoice itself uses, so this column can
                // never disagree with the document it links to.
                const totals = invoiceTotals({
                  items: Array.isArray(invoice.items) ? invoice.items : [],
                  discount_pkr: invoice.discount_pkr,
                  shipping_pkr: invoice.shipping_pkr,
                  tax_percent: Number(invoice.tax_percent),
                });
                return (
                  <tr key={invoice.id}>
                    <td data-label="Invoice">
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="font-mono text-sm font-black text-sc-text hover:text-acid"
                      >
                        {invoice.number}
                      </Link>
                    </td>
                    <td
                      data-label="Billed to"
                      className="text-sm font-bold text-sc-text"
                    >
                      {invoice.customer_name}
                    </td>
                    <td
                      data-label="Issued"
                      className="text-sm font-semibold tabular-nums text-sc-text-dim"
                    >
                      {new Date(invoice.issued_on).toLocaleDateString("en-GB")}
                    </td>
                    <td
                      data-label="Total"
                      className="text-sm font-black tabular-nums text-sc-text"
                    >
                      {money(totals.total)}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${
                          invoice.status === "paid"
                            ? "bg-acid/15 text-acid"
                            : invoice.status === "void"
                              ? "bg-sc-surface-2 text-sc-text-dimmer"
                              : "bg-amber-400/15 text-amber-300"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td data-label="" className="text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/invoices/${invoice.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-sc-border px-3.5 py-2 text-xs font-black lowercase text-sc-text transition-colors hover:border-acid hover:text-acid"
                        >
                          open
                        </Link>
                        <ActionButton
                          action={async () => {
                            "use server";
                            return deleteInvoice(invoice.id);
                          }}
                          variant="danger"
                          confirm={`Delete ${invoice.number}? This cannot be undone.`}
                        >
                          delete
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
