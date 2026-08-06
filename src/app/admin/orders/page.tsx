import Link from "next/link";
import { Download, Flag, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import OrdersTable, { type AdminOrder } from "./OrdersTable";
import MarkSeen from "./MarkSeen";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; flagged?: string }>;
}) {
  const { q, status, plan, flagged } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (status) query = query.eq("status", status);
  if (plan) query = query.eq("plan_id", plan);
  if (flagged === "1") query = query.eq("flagged", true);
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `reference.ilike.${term},full_name.ilike.${term},phone.ilike.${term},city.ilike.${term}`
    );
  }

  const { data, count, error } = await query;
  const orders = (data ?? []) as AdminOrder[];

  // Counted across every order, not just this filtered page — the badge in the
  // nav counts the same way, so clearing it here has to mean the same thing.
  const { count: unseen } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .is("admin_seen_at", null);

  // Money figures come from every row, not just this page.
  const { data: allRows } = await supabase
    .from("orders")
    .select("amount_pkr, status, plan_id, created_at");

  const all = allRows ?? [];
  const paidStatuses = ["paid", "printing", "shipped", "delivered"];
  const revenueAll = all
    .filter((o) => paidStatuses.includes(o.status))
    .reduce((s, o) => s + o.amount_pkr, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const revenueMonth = all
    .filter((o) => paidStatuses.includes(o.status) && new Date(o.created_at) >= monthStart)
    .reduce((s, o) => s + o.amount_pkr, 0);

  const pending = all.filter((o) => o.status === "pending");
  const pendingTotal = pending.reduce((s, o) => s + o.amount_pkr, 0);

  const byPlan = all.reduce<Record<string, number>>((acc, o) => {
    const k = o.plan_id ?? "—";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: "revenue this month", value: `Rs.${revenueMonth.toLocaleString()}` },
    { label: "revenue all time", value: `Rs.${revenueAll.toLocaleString()}` },
    { label: "awaiting payment", value: `${pending.length}`, hint: `Rs.${pendingTotal.toLocaleString()}` },
    { label: "orders", value: `${all.length}`, hint: Object.entries(byPlan).map(([k, v]) => `${k} ${v}`).join(" · ") },
  ];

  const csvHref = `/admin/orders/export${q || status || plan ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(plan ? { plan } : {}) })}` : ""}`;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="app-h1">Orders</h1>
          <p className="app-sub mt-1">
            {count ?? 0} matching · showing up to {PAGE_SIZE}
          </p>
        </div>
        <a
          href={csvHref}
          className="app-btn app-btn-primary"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {/* Money */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="app-panel app-panel-pad">
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{s.value}</p>
            <p className="app-sub mt-1">{s.label}</p>
            {s.hint && <p className="mt-1 text-[12px] text-white/35">{s.hint}</p>}
          </div>
        ))}
      </div>

      <MarkSeen unseen={unseen ?? 0} />

      {/* Filters */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="reference, name, phone, city"
            className="app-input w-64 pl-9"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="app-input w-auto bg-ink"
        >
          <option value="">any status</option>
          {["pending", "paid", "printing", "shipped", "delivered", "cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="plan"
          defaultValue={plan ?? ""}
          className="app-input w-auto bg-ink"
        >
          <option value="">any plan</option>
          {Object.keys(byPlan).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          type="submit"
          className="app-btn app-btn-ghost"
        >
          filter
        </button>
        <Link
          href={flagged === "1" ? "/admin/orders" : "/admin/orders?flagged=1"}
          className={`app-btn ${flagged === "1" ? "app-btn-primary" : "app-btn-ghost"}`}
        >
          <Flag className="h-3.5 w-3.5" />
          Flagged
        </Link>
      </form>

      {error && (
        <div className="app-panel app-panel-pad text-[13px] font-medium text-hotpink">
          {error.message}
        </div>
      )}

      {orders.length === 0 ? (
        <p className="app-panel app-panel-pad text-center text-[13px] text-white/35">
          No orders match.
        </p>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  );
}
