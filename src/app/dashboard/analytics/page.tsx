import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SmartphoneNfc, Eye, MousePointerClick, UserPlus, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type Tap = { created_at: string; source: string; visitor_hash: string | null };
type ReferralEvent = { created_at: string; event_type: string };

function percent(numerator: number, denominator: number): string {
  if (!denominator) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

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

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-slate-400">Please log in.</p>;
  }

  // RLS scopes both of these to the current user automatically.
  const [{ data: taps }, { data: events }, { data: cards }] = await Promise.all([
    supabase
      .from("card_taps")
      .select("created_at, source, visitor_hash")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("referral_events").select("created_at, event_type").limit(2000),
    supabase.from("card_profiles").select("id, username, full_name"),
  ]);

  const tapRows: Tap[] = taps ?? [];
  const eventRows: ReferralEvent[] = events ?? [];

  const totalTaps = tapRows.length;
  const uniqueVisitors = new Set(tapRows.map((t) => t.visitor_hash).filter(Boolean)).size;
  const nfcTaps = tapRows.filter((t) => t.source === "nfc").length;

  const bannerViews = eventRows.filter((e) => e.event_type === "banner_view").length;
  const bannerClicks = eventRows.filter((e) => e.event_type === "banner_click").length;
  const signups = eventRows.filter((e) => e.event_type === "signup").length;

  const series = dailySeries(tapRows);
  const peak = Math.max(1, ...series.map((d) => d.count));

  const stats = [
    { label: "Total taps", value: totalTaps, icon: SmartphoneNfc, hint: `${nfcTaps} from physical cards` },
    { label: "Unique visitors", value: uniqueVisitors, icon: Eye, hint: "per day, deduplicated" },
    { label: "Banner clicks", value: bannerClicks, icon: MousePointerClick, hint: `${percent(bannerClicks, bannerViews)} of ${bannerViews} views` },
    { label: "Referred signups", value: signups, icon: UserPlus, hint: `${percent(signups, bannerClicks)} of clicks` },
  ];

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-3 text-4xl font-black tracking-tighter text-white">
          analytics        </h1>
        <p className="mb-7 font-medium text-white/50">
          You don&apos;t have a digital card yet. Create one and every tap will show up here.
        </p>
        <Link
          href="/dashboard/card"
          className="app-btn app-btn-primary"
        >
          create my card
        </Link>
      </div>
    );
  }

  // Rotate through the palette so the tiles read as a set, not a grid of greys.
  const TILE = [
    "bg-acid text-ink",
    "bg-hotpink text-white",
    "bg-violet-pop text-white",
    "bg-white text-ink",
  ];

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      <div>
        <h1 className="app-h1">Analytics</h1>
        <p className="app-sub mt-1">
          Every tap, and how many turned into new customers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => {
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

      {/* Taps over time */}
      <section className="app-panel app-panel-pad">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-acid" />
          <h2 className="text-[15px] font-semibold text-white">taps — last 14 days</h2>
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

      {/* Viral funnel */}
      <section className="app-panel app-panel-pad">
        <h2 className="mb-6 text-[15px] font-semibold text-white">referral funnel</h2>
        <div className="space-y-3">
          {[
            { label: "card opened", value: totalTaps },
            { label: "saw the banner", value: bannerViews },
            { label: "tapped “get yours”", value: bannerClicks },
            { label: "signed up", value: signups },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-4">
              <span className="w-40 shrink-0 text-sm font-bold text-white/50">
                {step.label}
              </span>
              <div className="h-8 flex-1 overflow-hidden rounded-lg border-2 border-white/10 bg-white/5">
                <div
                  className="h-full min-w-[3px] bg-gradient-to-r from-acid to-hotpink"
                  style={{ width: `${(step.value / Math.max(1, totalTaps)) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-black tabular-nums text-white">
                {step.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
