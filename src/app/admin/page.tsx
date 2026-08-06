import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreditCard, SmartphoneNfc, Users, UserPlus, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type Tap = { created_at: string; source: string };

/** Taps per day for the last 14 days, oldest first. */
function dailySeries(taps: Tap[], days = 14) {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const tap of taps) {
    const key = tap.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export default async function AdminOverview() {
  const supabase = await createClient();

  // `head: true` with count means Postgres returns the number without shipping
  // any rows — these tables grow without limit.
  const [profiles, cards, nfc, taps, signups] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("card_profiles").select("id", { count: "exact", head: true }),
    supabase.from("nfc_cards").select("id", { count: "exact", head: true }),
    supabase.from("card_taps").select("created_at, source").limit(5000),
    supabase
      .from("referral_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "signup"),
  ]);

  // The new-order alert. Everything that arrived since an admin last opened
  // the orders list — the closest thing to an inbox until email is wired up.
  const { data: newOrders } = await supabase
    .from("orders")
    .select("id, reference, full_name, city, amount_pkr, quantity, plan_id, branding, created_at")
    .is("admin_seen_at", null)
    .order("created_at", { ascending: false })
    .limit(8);

  const tapRows: Tap[] = taps.data ?? [];
  const nfcTaps = tapRows.filter((t) => t.source === "nfc").length;
  const series = dailySeries(tapRows);
  const peak = Math.max(1, ...series.map((d) => d.count));

  const stats = [
    {
      label: "users",
      value: profiles.count ?? 0,
      icon: Users,
      hint: "registered accounts",
    },
    {
      label: "published cards",
      value: cards.count ?? 0,
      icon: CreditCard,
      hint: "card profiles created",
    },
    {
      label: "taps",
      value: tapRows.length,
      icon: SmartphoneNfc,
      hint: `${nfcTaps} from physical cards`,
    },
    {
      label: "referred signups",
      value: signups.count ?? 0,
      icon: UserPlus,
      hint: `${nfc.count ?? 0} NFC cards linked`,
    },
  ];

  const error = profiles.error ?? cards.error ?? taps.error;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Overview</h1>
        <p className="app-sub mt-1">Everything, across every account.</p>
      </div>

      {error && (
        <div className="app-panel app-panel-pad text-[13px] font-medium text-hotpink">
          {error.message} — check that migration 004 has been applied and your
          account has is_admin set.
        </div>
      )}

      {(newOrders ?? []).length > 0 && (
        <section className="app-panel app-panel-pad border-hotpink/40">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-hotpink px-1.5 text-[12px] font-black text-white">
              {newOrders!.length}
            </span>
            <h2 className="font-black lowercase">new orders</h2>
            <Link
              href="/admin/orders"
              className="ml-auto text-[13px] font-semibold text-acid hover:underline"
            >
              open all
            </Link>
          </div>
          <ul className="divide-y divide-white/8">
            {newOrders!.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="font-mono text-[13px] font-black text-white">
                  {o.reference}
                </span>
                <span className="text-[13px] font-semibold text-white/70">
                  {o.full_name} · {o.city}
                </span>
                <span className="text-[12px] text-white/40">
                  {o.quantity} × {o.plan_id}
                  {o.branding === "unbranded" && " · no branding"}
                </span>
                <span className="ml-auto text-[13px] font-black tabular-nums">
                  Rs.{(o.amount_pkr as number).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-white/30">
            Cleared when you open the orders list. No email is sent yet — set
            RESEND_API_KEY and ORDER_ALERT_EMAIL to turn that on.
          </p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="app-panel app-panel-pad"
            >
              <Icon className="mb-4 h-5 w-5" />
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</p>
              <p className="app-sub mt-1">{stat.label}</p>
              <p className="mt-1 text-[12px] text-white/35">{stat.hint}</p>
            </div>
          );
        })}
      </div>

      <section className="app-panel app-panel-pad">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-acid" />
          <h2 className="font-black lowercase">taps across the platform — last 14 days</h2>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {series.map((day) => (
            <div key={day.date} className="group flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="min-h-[3px] w-full rounded-t border-2 border-ink bg-acid transition-colors group-hover:bg-hotpink"
                  style={{ height: `${(day.count / peak) * 100}%` }}
                  title={`${day.date}: ${day.count} taps`}
                />
              </div>
              <span className="text-[9px] font-bold tabular-nums text-white/35">
                {day.date.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/admin/cards"
        className="app-btn app-btn-primary"
      >
        browse all cards
      </Link>
    </div>
  );
}
