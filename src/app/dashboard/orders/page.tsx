import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import OrderForm from "./OrderForm";
import type { CardProfile } from "@/lib/card";
import { STATUS_STEPS, statusTone } from "./status";

export const dynamic = "force-dynamic";

type Plan = {
  id: string;
  name: string;
  price_pkr: number;
  blurb: string | null;
  perks: string[];
};

export default async function MyOrders() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p className="app-sub font-bold">Please log in.</p>;

  // The profile was read only to pre-fill the order form's name, which it
  // deliberately does not do — the person ordering may not be the person the
  // card is posted to. Dropping it takes a query off every visit to this page.
  const [{ data: plans }, { data: orders }, { data: card }] =
    await Promise.all([
    supabase.from("plans").select("*").eq("enabled", true).order("sort_order"),
    supabase
      .from("orders")
      .select("id, reference, status, amount_pkr, quantity, plan_id, created_at, estimated_delivery")
      .order("created_at", { ascending: false }),
    supabase
      .from("card_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const rows = orders ?? [];

  return (
    <div className="max-w-4xl space-y-9 pb-16">
      <div>
        <h1 className="app-h1">Orders</h1>
        <p className="app-sub mt-1">
          Order a printed NFC card, and track it here.
        </p>
      </div>

      {rows.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
            your orders
          </p>
          {rows.map((o) => {
            const step = STATUS_STEPS.indexOf(o.status);
            return (
              <Link
                key={o.id}
                href={`/dashboard/orders/${o.id}`}
                className="group flex flex-wrap items-center justify-between gap-4 app-panel app-panel-pad transition-colors hover:border-sc-gold/50"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sc-surface-2">
                    <Package className="h-5 w-5 text-sc-gold" />
                  </span>
                  <div>
                    <p className="font-mono text-sm font-black text-sc-text">{o.reference}</p>
                    <p className="text-xs font-semibold text-sc-text-dimmer">
                      {o.quantity} × {o.plan_id} ·{" "}
                      {o.amount_pkr === 0 ? "Free" : `Rs.${o.amount_pkr.toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {o.estimated_delivery && step < 4 && (
                    <span className="hidden text-xs font-bold text-sc-text-dimmer sm:block">
                      est. {new Date(o.estimated_delivery).toLocaleDateString("en-GB")}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(o.status)}`}
                  >
                    {o.status}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-sc-text-dimmer transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <section>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
          {rows.length > 0 ? "order another" : "place an order"}
        </p>
        <OrderForm
          plans={(plans ?? []) as Plan[]}
          hasCard={Boolean(card?.username)}
          card={(card as CardProfile | null) ?? null}
        />
      </section>
    </div>
  );
}
