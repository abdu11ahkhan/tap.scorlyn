import Link from "next/link";
import { Download, Flag, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";
import OrdersTable, { type AdminOrder } from "./OrdersTable";
import MarkSeen from "./MarkSeen";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; flagged?: string; unassigned?: string }>;
}) {
  const { q, status, plan, flagged, unassigned } = await searchParams;
  const supabase = await createClient();

  // Delivered orders whose card_profile_id has no matching nfc_cards row —
  // the exact gap Phase 11 made visible to the customer ("Delivered — we're
  // linking it to your digital card") but that, until now, had no operator
  // surface at all: nothing here ever pointed an admin back at it.
  const { data: deliveredRows } = await supabase
    .from("orders")
    .select("id, card_profile_id")
    .eq("status", "delivered")
    .not("card_profile_id", "is", null);
  const deliveredProfileIds = [...new Set((deliveredRows ?? []).map((o) => o.card_profile_id as string))];

  let assignedProfileIds = new Set<string>();
  if (deliveredProfileIds.length > 0) {
    const { data: nfcRows } = await supabase
      .from("nfc_cards")
      .select("card_profile_id")
      .in("card_profile_id", deliveredProfileIds);
    assignedProfileIds = new Set((nfcRows ?? []).map((r) => r.card_profile_id as string));
  }
  const unassignedOrderIds = (deliveredRows ?? [])
    .filter((o) => o.card_profile_id && !assignedProfileIds.has(o.card_profile_id))
    .map((o) => o.id);

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (status) query = query.eq("status", status);
  if (plan) query = query.eq("plan_id", plan);
  if (flagged === "1") query = query.eq("flagged", true);
  if (unassigned === "1") query = query.in("id", unassignedOrderIds.length > 0 ? unassignedOrderIds : ["00000000-0000-0000-0000-000000000000"]);
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

  // Money figures come from every row, not just this page. A bare .select()
  // truncates silently at Postgrest's 1000-row cap — fetchAll pages past it so
  // "revenue all time" is not quietly wrong the day order #1001 ships.
  const all = await fetchAll<{
    amount_pkr: number;
    status: string;
    plan_id: string | null;
    created_at: string;
  }>((from, to) =>
    supabase
      .from("orders")
      .select("amount_pkr, status, plan_id, created_at")
      .range(from, to)
  );
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
    {
      label: "delivered, unassigned",
      value: `${unassignedOrderIds.length}`,
      hint: unassignedOrderIds.length > 0 ? "needs an NFC card linked" : undefined,
      warn: unassignedOrderIds.length > 0,
    },
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) =>
          s.label === "delivered, unassigned" && s.warn ? (
            <Link
              key={s.label}
              href="/admin/orders?unassigned=1"
              className="app-panel app-panel-pad border-amber-400/40 transition-colors hover:border-amber-400"
            >
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-amber-300">{s.value}</p>
              <p className="app-sub mt-1">{s.label}</p>
              {s.hint && <p className="mt-1 text-[12px] text-amber-300/70">{s.hint}</p>}
            </Link>
          ) : (
            <div key={s.label} className="app-panel app-panel-pad">
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{s.value}</p>
              <p className="app-sub mt-1">{s.label}</p>
              {s.hint && <p className="mt-1 text-[12px] text-sc-text-dimmer">{s.hint}</p>}
            </div>
          )
        )}
      </div>

      {unassigned === "1" && (
        <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-3 border-amber-400/40">
          <p className="text-[13px] font-medium text-amber-300">
            Showing delivered orders with no NFC card linked yet.
          </p>
          <Link href="/admin/orders" className="app-btn app-btn-ghost">
            Clear
          </Link>
        </div>
      )}

      <MarkSeen unseen={unseen ?? 0} />

      {/* Filters */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-text-dimmer" />
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
        <p className="app-panel app-panel-pad text-center text-[13px] text-sc-text-dimmer">
          No orders match.
        </p>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  );
}
