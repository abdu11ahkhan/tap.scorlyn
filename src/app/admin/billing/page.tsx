import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";
import PaymentMethods, { type ShopPayment } from "./PaymentMethods";

export const dynamic = "force-dynamic";

/** Revenue is on the orders page; this is where the money is *sent*. */
export default async function AdminBilling() {
  const supabase = await createClient();

  // A bare .select() truncates silently past Postgrest's 1000-row cap, which
  // is exactly wrong for a number that is supposed to be everything ever
  // taken — see fetchAll for the full story (the orders page hit the same
  // thing).
  const [{ data: methods }, rows] = await Promise.all([
    supabase.from("shop_payment_methods").select("*").order("sort_order"),
    fetchAll<{ amount_pkr: number; status: string }>((from, to) =>
      supabase.from("orders").select("amount_pkr, status").range(from, to)
    ),
  ]);
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
