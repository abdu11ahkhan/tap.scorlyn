import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvoiceSheet, { type InvoiceRow } from "@/app/admin/invoices/[id]/InvoiceSheet";

export const dynamic = "force-dynamic";

/**
 * An invoice the customer can open.
 *
 * Reached only with the token on the invoice itself — the table stays
 * admin-only and this goes through a function that returns just the fields
 * the printed invoice shows, never who created it or what order it came from.
 */
export default async function SharedInvoice({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("invoice_by_token", { token });
  const invoice = Array.isArray(data) ? data[0] : data;
  if (!invoice) notFound();

  return (
    <div className="min-h-screen bg-[#0B0B0B] p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <InvoiceSheet invoice={invoice as InvoiceRow} />
      </div>
    </div>
  );
}
