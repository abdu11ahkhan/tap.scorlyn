import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvoiceEditor from "../../InvoiceEditor";
import { saveInvoice, type InvoiceFields } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditInvoice({
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

  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, price_pkr")
    .eq("enabled", true)
    .order("sort_order");

  const initial: InvoiceFields = {
    customer_name: invoice.customer_name,
    customer_phone: invoice.customer_phone,
    customer_email: invoice.customer_email,
    customer_address: invoice.customer_address,
    issued_on: invoice.issued_on,
    due_on: invoice.due_on,
    items: Array.isArray(invoice.items) ? invoice.items : [],
    discount_pkr: invoice.discount_pkr,
    shipping_pkr: invoice.shipping_pkr,
    tax_percent: Number(invoice.tax_percent),
    notes: invoice.notes,
    status: invoice.status,
    display: (invoice.display ?? {}) as Record<string, boolean>,
  };

  return (
    <InvoiceEditor
      initial={initial}
      catalogue={plans ?? []}
      invoiceId={invoice.id}
      number={invoice.number}
      onSave={async (fields: InvoiceFields) => {
        "use server";
        const r = await saveInvoice(id, fields);
        return { ...r, data: { id } };
      }}
    />
  );
}
