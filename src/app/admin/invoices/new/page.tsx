import InvoiceEditor, { EMPTY_INVOICE } from "../InvoiceEditor";
import { createInvoice, type InvoiceFields } from "../../actions";

export const dynamic = "force-dynamic";

export default function NewInvoice() {
  return (
    <InvoiceEditor
      initial={EMPTY_INVOICE}
      onSave={async (fields: InvoiceFields) => {
        "use server";
        return createInvoice(fields);
      }}
    />
  );
}
