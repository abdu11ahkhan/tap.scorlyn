import { createClient } from "@/lib/supabase/server";
import PaymentMethods, { type ShopPayment } from "./PaymentMethods";

export const dynamic = "force-dynamic";

/** Revenue is on the orders page; this is where the money is *sent*. */
export default async function AdminBilling() {
  const supabase = await createClient();

  const [{ data: methods }, { data: orders }] = await Promise.all([
    supabase.from("shop_payment_methods").select("*").order("sort_order"),
    supabase.from("orders").select("amount_pkr, status"),
  ]);

  const rows = orders ?? [];
  const settled = ["paid", "printing", "shipped", "delivered"];
  const taken = rows.filter((o) => settled.includes(o.status)).reduce((s, o) => s + o.amount_pkr, 0);
  const awaiting = rows.filter((o) => o.status === "pending").reduce((s, o) => s + o.amount_pkr, 0);

  const money = (n: number) => `Rs.${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Billing</h1>
        <p className="app-sub mt-1">
          Where customers send money, and what has come in.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: "Confirmed", value: money(taken), hint: "paid and beyond" },
          { label: "Awaiting payment", value: money(awaiting), hint: "pending orders" },
          { label: "Accounts", value: String((methods ?? []).length), hint: "shown at checkout" },
        ].map((s) => (
          <div key={s.label} className="app-panel app-panel-pad">
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{s.value}</p>
            <p className="app-sub mt-1">{s.label}</p>
            <p className="mt-1 text-[12px] text-white/35">{s.hint}</p>
          </div>
        ))}
      </div>

      <PaymentMethods methods={(methods ?? []) as ShopPayment[]} />
    </div>
  );
}
