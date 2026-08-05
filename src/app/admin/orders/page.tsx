import Link from "next/link";
import { Download, Flag, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import OrdersTable, { type AdminOrder } from "./OrdersTable";

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
    { label: "revenue this month", value: `Rs.${revenueMonth.toLocaleString()}`, tile: "bg-acid text-ink" },
    { label: "revenue all time", value: `Rs.${revenueAll.toLocaleString()}`, tile: "bg-hotpink text-white" },
    { label: "awaiting payment", value: `${pending.length}`, hint: `Rs.${pendingTotal.toLocaleString()}`, tile: "bg-violet-pop text-white" },
    { label: "orders", value: `${all.length}`, hint: Object.entries(byPlan).map(([k, v]) => `${k} ${v}`).join(" · "), tile: "bg-white text-ink" },
  ];

  const csvHref = `/admin/orders/export${q || status || plan ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(plan ? { plan } : {}) })}` : ""}`;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">
            orders<span className="text-acid">.</span>
          </h1>
          <p className="mt-2 font-medium text-white/50">
            {count ?? 0} matching · showing up to {PAGE_SIZE}
          </p>
        </div>
        <a
          href={csvHref}
          className="sticker sticker-press inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-acid px-6 text-sm font-black uppercase tracking-tight text-ink"
        >
          <Download className="h-4 w-4" />
          export csv
        </a>
      </div>

      {/* Money */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`sticker-lg rounded-2xl border-2 border-ink p-5 ${s.tile}`}>
            <p className="text-2xl font-black tabular-nums tracking-tighter">{s.value}</p>
            <p className="mt-1 text-sm font-black lowercase">{s.label}</p>
            {s.hint && <p className="mt-1 text-xs font-semibold opacity-60">{s.hint}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="reference, name, phone, city"
            className="h-12 w-64 rounded-full border-2 border-white/15 bg-white/[0.04] pl-10 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-12 rounded-full border-2 border-white/15 bg-ink px-4 text-sm font-bold text-white"
        >
          <option value="">any status</option>
          {["pending", "paid", "printing", "shipped", "delivered", "cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="plan"
          defaultValue={plan ?? ""}
          className="h-12 rounded-full border-2 border-white/15 bg-ink px-4 text-sm font-bold text-white"
        >
          <option value="">any plan</option>
          {Object.keys(byPlan).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          type="submit"
          className="h-12 rounded-full border-2 border-white/20 px-6 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
        >
          filter
        </button>
        <Link
          href={flagged === "1" ? "/admin/orders" : "/admin/orders?flagged=1"}
          className={`inline-flex h-12 items-center gap-2 rounded-full border-2 px-5 text-sm font-black lowercase transition-colors ${
            flagged === "1"
              ? "border-ink bg-hotpink text-white"
              : "border-white/20 text-white/60 hover:border-hotpink hover:text-hotpink"
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          flagged
        </Link>
      </form>

      {error && (
        <div className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
          {error.message}
        </div>
      )}

      {orders.length === 0 ? (
        <p className="rounded-2xl border-2 border-white/12 bg-white/[0.03] p-10 text-center font-bold text-white/40">
          No orders match.
        </p>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  );
}
