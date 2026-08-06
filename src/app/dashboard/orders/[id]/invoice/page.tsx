import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

/**
 * Printable invoice.
 *
 * Deliberately HTML rather than a generated PDF: the browser's own
 * "Save as PDF" produces a correct, selectable, sensibly-sized file, and
 * bundling a PDF library to redraw this layout server-side would add weight
 * for a worse result. The print stylesheet hides everything but the invoice.
 */
export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return notFound();

  const unit = order.quantity > 0 ? Math.round(order.amount_pkr / order.quantity) : 0;

  return (
    <div className="min-h-screen bg-white p-6 text-[#111] print:p-0">
      <div className="mx-auto max-w-2xl">
        <PrintButton />

        <div className="border-2 border-black p-8 print:border-0 print:p-0">
          <div className="flex items-start justify-between border-b-2 border-black pb-6">
            <div>
              <p className="text-3xl font-black tracking-tighter">ScorlynTap</p>
              <p className="mt-1 text-sm font-semibold opacity-60">NFC digital business cards</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest opacity-50">invoice</p>
              <p className="font-mono text-lg font-black">{order.reference}</p>
              <p className="mt-1 text-sm font-semibold opacity-60">
                {new Date(order.created_at).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-50">billed to</p>
              <p className="mt-2 font-black">{order.full_name}</p>
              <p className="text-sm font-semibold opacity-70">{order.phone}</p>
              <p className="text-sm font-semibold opacity-70">
                {order.address}, {order.city}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-black uppercase tracking-widest opacity-50">status</p>
              <p className="mt-2 font-black uppercase">{order.status}</p>
              {order.payment_verified_at && (
                <p className="text-sm font-semibold opacity-70">
                  Paid {new Date(order.payment_verified_at).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
          </div>

          <table className="mt-8 w-full text-left">
            <thead>
              <tr className="border-y-2 border-black text-xs font-black uppercase tracking-widest">
                <th className="py-3">Item</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/15">
                <td className="py-4 font-bold capitalize">{order.plan_id} card</td>
                <td className="py-4 text-center font-semibold">{order.quantity}</td>
                <td className="py-4 text-right font-semibold">Rs.{unit.toLocaleString()}</td>
                <td className="py-4 text-right font-black">
                  Rs.{order.amount_pkr.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-52">
              <div className="flex justify-between border-t-2 border-black pt-3">
                <span className="font-black uppercase">Total</span>
                <span className="text-xl font-black">
                  Rs.{order.amount_pkr.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-10 border-t border-black/15 pt-4 text-xs font-semibold opacity-50">
            Thank you. Questions about this order? Quote {order.reference}.
          </p>
        </div>
      </div>
    </div>
  );
}
