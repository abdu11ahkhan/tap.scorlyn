import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import ShareInvoice from "./ShareInvoice";
import { createClient } from "@/lib/supabase/server";
import InvoiceSheet, { type InvoiceRow } from "./InvoiceSheet";

export const dynamic = "force-dynamic";

export default async function ViewInvoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="app-h1">Invoice {invoice.number}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/invoices/${id}/edit`}
            className="app-pill inline-flex items-center gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            edit
          </Link>
          <ShareInvoice invoiceId={id} existingToken={invoice.share_token} />
          <Link href="/admin/invoices" className="app-pill inline-flex">
            all invoices
          </Link>
        </div>
      </div>

      <InvoiceSheet invoice={invoice as InvoiceRow} />
    </div>
  );
}
