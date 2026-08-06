import Link from "next/link";
import { ArrowUpRight, FileText, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, statusTone } from "../orders/status";

export const dynamic = "force-dynamic";

type Plan = { id: string; name: string; price_pkr: number; blurb: string | null };
type Order = {
  id: string;
  reference: string;
  status: string;
  amount_pkr: number;
  quantity: number;
  plan_id: string | null;
  branding: string | null;
  created_at: string;
};

/** Statuses where the money is actually ours. */
const SETTLED = ["paid", "printing", "shipped", "delivered"];

/**
 * Billing.
 *
 * This page used to advertise a $12/month "Pro Plan" with unlimited websites
 * and custom domains — an artefact of the site-builder this project started
 * as. None of that exists: cards are bought once, in rupees, and there is no
 * subscription to manage. So the page shows what there actually is to show —
 * what you've spent, on what, and where the invoices are.
 */
export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="app-sub">Please log in.</p>;
  }

  const [{ data: planRows }, { data: orderRows }] = await Promise.all([
    supabase.from("plans").select("id, name, price_pkr, blurb").eq("enabled", true).order("sort_order"),
    supabase
      .from("orders")
      .select("id, reference, status, amount_pkr, quantity, plan_id, branding, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const plans = (planRows ?? []) as Plan[];
  const orders = (orderRows ?? []) as Order[];

  const spent = orders
    .filter((o) => SETTLED.includes(o.status))
    .reduce((sum, o) => sum + o.amount_pkr, 0);
  const awaiting = orders.filter((o) => o.status === "pending");
  const cardsOrdered = orders
    .filter((o) => SETTLED.includes(o.status))
    .reduce((sum, o) => sum + o.quantity, 0);

  const money = (n: number) => `Rs.${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Billing</h1>
        <p className="app-sub mt-1">
          What you&apos;ve paid, and the invoices for it. Cards are a one-off
          purchase — there&apos;s no subscription.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          { label: "Total paid", value: money(spent), hint: "confirmed orders only" },
          { label: "Cards ordered", value: String(cardsOrdered), hint: "across all orders" },
          {
            label: "Awaiting payment",
            value: awaiting.length ? money(awaiting.reduce((s, o) => s + o.amount_pkr, 0)) : "—",
            hint: awaiting.length ? `${awaiting.length} order${awaiting.length === 1 ? "" : "s"}` : "nothing outstanding",
          },
        ].map((stat) => (
          <div key={stat.label} className="app-panel app-panel-pad">
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</p>
            <p className="app-sub mt-1">{stat.label}</p>
            <p className="mt-1 text-[12px] text-white/35">{stat.hint}</p>
          </div>
        ))}
      </div>

      {/* What things cost */}
      <section className="app-panel app-panel-pad">
        <h2 className="font-black lowercase">what things cost</h2>
        <p className="app-sub mt-1">Prices are set by us and can change; placed orders keep the price they were quoted.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[15px] font-semibold">{p.name}</p>
              <p className="mt-1 text-xl font-black tracking-tight">
                {p.price_pkr === 0 ? "Free" : money(p.price_pkr)}
              </p>
              {p.blurb && <p className="app-sub mt-1.5 text-[12px]">{p.blurb}</p>}
            </div>
          ))}
        </div>

        <Link href="/dashboard/orders" className="app-btn app-btn-primary mt-5">
          Order a card
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Invoices */}
      <section className="app-panel app-panel-pad">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          <h2 className="font-black lowercase">invoices</h2>
        </div>

        {orders.length === 0 ? (
          <p className="app-sub">
            No orders yet. Anything you buy shows up here with an invoice you can
            download.
          </p>
        ) : (
          <div className="divide-y divide-white/8">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
                <span className="font-mono text-[13px] font-black">{o.reference}</span>

                <span className="text-[13px] text-white/55">
                  {o.quantity} × {o.plan_id}
                  {o.branding === "unbranded" && " · no branding"}
                </span>

                <span className="text-[12px] text-white/35">
                  {new Date(o.created_at).toLocaleDateString("en-GB")}
                </span>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${statusTone(o.status)}`}
                >
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>

                <span className="ml-auto text-[13px] font-black tabular-nums">
                  {money(o.amount_pkr)}
                </span>

                <Link
                  href={`/dashboard/orders/${o.id}/invoice`}
                  className="app-btn app-btn-ghost shrink-0"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Invoice
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="app-panel app-panel-pad">
        <h2 className="font-black lowercase">how payment works</h2>
        <p className="app-sub mt-1 max-w-2xl">
          Orders are paid by bank transfer or EasyPaisa/JazzCash. You&apos;ll get
          the details on the order page, upload proof of payment there, and we
          confirm it manually before printing. Nothing is charged automatically
          and no card details are stored.
        </p>
      </section>
    </div>
  );
}
