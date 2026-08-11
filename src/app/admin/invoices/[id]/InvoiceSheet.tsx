"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import {
  invoiceTotals,
  lineTotal,
  money,
  usableItems,
  type InvoiceItem,
} from "@/lib/invoice";

export type InvoiceRow = {
  id: string;
  number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  issued_on: string;
  due_on: string | null;
  items: InvoiceItem[];
  discount_pkr: number;
  shipping_pkr: number;
  tax_percent: number;
  notes: string | null;
  status: string;
};

const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : null;

/**
 * The invoice as it goes on paper.
 *
 * HTML rather than a server-generated PDF: the browser's own "Save as PDF"
 * produces a selectable, correctly sized file, and pulling in a PDF library
 * to redraw this layout would add weight for a worse result. The print rules
 * in globals.css hide everything outside `.artwork-print`, so the console's
 * sidebar and this page's own controls stay off the paper.
 */
export default function InvoiceSheet({ invoice }: { invoice: InvoiceRow }) {
  const items = usableItems(invoice.items ?? []);
  const totals = invoiceTotals({
    items,
    discount_pkr: invoice.discount_pkr,
    shipping_pkr: invoice.shipping_pkr,
    tax_percent: invoice.tax_percent,
  });

  // "Save as PDF" names the file after the document title, so without this
  // every invoice saves under the same name.
  const fileName = `${invoice.number} - ${invoice.customer_name}`.replace(
    /[^a-zA-Z0-9 _-]/g,
    ""
  );

  useEffect(() => {
    const original = document.title;
    const before = () => {
      document.title = fileName;
    };
    const after = () => {
      document.title = original;
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      document.title = original;
    };
  }, [fileName]);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black print:hidden"
      >
        <Printer className="h-4 w-4" />
        Print / save as PDF
      </button>

      <div className="artwork-print rounded-2xl bg-white p-10 text-[#111] print:rounded-none print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-black pb-6">
          <div>
            <p className="text-3xl font-black tracking-tighter">ScorlynTap</p>
            <p className="mt-1 text-sm font-semibold opacity-60">
              NFC digital business cards
            </p>
            <p className="mt-0.5 text-sm font-semibold opacity-60">
              tap.scorlyn.com
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest opacity-50">
              invoice
            </p>
            <p className="font-mono text-lg font-black">{invoice.number}</p>
            <p className="mt-1 text-sm font-semibold opacity-60">
              Issued {date(invoice.issued_on)}
            </p>
            {invoice.due_on && (
              <p className="text-sm font-semibold opacity-60">
                Due {date(invoice.due_on)}
              </p>
            )}
            {invoice.status !== "unpaid" && (
              <p className="mt-2 inline-block border-2 border-black px-2 py-0.5 text-xs font-black uppercase tracking-widest">
                {invoice.status}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-black uppercase tracking-widest opacity-50">
            billed to
          </p>
          <p className="mt-2 font-black">{invoice.customer_name}</p>
          {invoice.customer_phone && (
            <p className="text-sm font-semibold opacity-70">
              {invoice.customer_phone}
            </p>
          )}
          {invoice.customer_email && (
            <p className="text-sm font-semibold opacity-70">
              {invoice.customer_email}
            </p>
          )}
          {invoice.customer_address && (
            <p className="text-sm font-semibold opacity-70">
              {invoice.customer_address}
            </p>
          )}
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="pb-2 text-xs font-black uppercase tracking-widest opacity-50">
                description
              </th>
              <th className="pb-2 text-right text-xs font-black uppercase tracking-widest opacity-50">
                qty
              </th>
              <th className="pb-2 text-right text-xs font-black uppercase tracking-widest opacity-50">
                unit
              </th>
              <th className="pb-2 text-right text-xs font-black uppercase tracking-widest opacity-50">
                amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-black/15">
                <td className="py-2.5 font-semibold">{item.description}</td>
                <td className="py-2.5 text-right font-semibold tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-2.5 text-right font-semibold tabular-nums">
                  {money(item.unit_price_pkr)}
                </td>
                <td className="py-2.5 text-right font-black tabular-nums">
                  {money(lineTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5">
            <Line label="Subtotal" value={money(totals.subtotal)} />
            {totals.discount > 0 && (
              <Line label="Discount" value={`− ${money(totals.discount)}`} />
            )}
            {totals.tax > 0 && (
              <Line
                label={`Tax (${invoice.tax_percent}%)`}
                value={money(totals.tax)}
              />
            )}
            {totals.shipping > 0 && (
              <Line label="Delivery" value={money(totals.shipping)} />
            )}
            <div className="flex items-baseline justify-between border-t-2 border-black pt-2.5">
              <span className="text-sm font-black uppercase tracking-widest">
                Total
              </span>
              <span className="text-2xl font-black tabular-nums">
                {money(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 border-t border-black/15 pt-4">
            <p className="text-xs font-black uppercase tracking-widest opacity-50">
              notes
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold opacity-80">
              {invoice.notes}
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-xs font-semibold opacity-45">
          Thank you. ScorlynTap · tap.scorlyn.com
        </p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm font-semibold opacity-60">{label}</span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
