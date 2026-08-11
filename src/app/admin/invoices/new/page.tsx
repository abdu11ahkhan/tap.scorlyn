import InvoiceEditor, { EMPTY_INVOICE } from "../InvoiceEditor";
import { createClient } from "@/lib/supabase/server";
import { createInvoice, type InvoiceFields } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewInvoice() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, price_pkr")
    .eq("enabled", true)
    .order("sort_order");

  return (
    <InvoiceEditor
      initial={EMPTY_INVOICE}
      catalogue={plans ?? []}
      onSave={async (fields: InvoiceFields) => {
        "use server";
        return createInvoice(fields);
      }}
    />
  );
}
