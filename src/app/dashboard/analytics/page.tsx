import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Eye,
  MessageCircle,
  Share2,
  SmartphoneNfc,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  summarize,
  summarizeByCard,
  summarizeByNfcCard,
  rangeToSince,
  TIME_RANGES,
  EVENT_LABELS,
  type TimeRange,
  type TapRow,
} from "@/lib/analytics";
import TimeRangeTabs from "@/components/dashboard/analytics/TimeRangeTabs";
import TrendChart from "@/components/dashboard/analytics/TrendChart";

export const dynamic = "force-dynamic";

// A row count no individual or team's realistic volume approaches at 90d/all
// — matches the existing platform-wide admin query's own cap (5000), scoped
// per-account instead of platform-wide, so this is a much smaller ceiling
// for the same reason: one bounded query, no pagination machinery for a
// number nobody will actually hit yet.
const ROW_CAP = 10_000;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: TimeRange = TIME_RANGES.includes(rangeParam as TimeRange)
    ? (rangeParam as TimeRange)
    : "30d";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  const isCorporateOwner = profile?.account_type === "corporate";

  // Authorization lives here, not in the query param: which cards this
  // page can ever see is derived entirely from the authenticated session,
  // scoped explicitly by user_id/org_owner_id — the same columns RLS
  // itself checks, so a client can't influence which cards get included
  // no matter what it sends. ?range= only ever selects a time window.
  const { data: cards } = await supabase
    .from("card_profiles")
    .select("id, username, full_name")
    .eq(isCorporateOwner ? "org_owner_id" : "user_id", user.id);

  const cardList = cards ?? [];
  const cardIds = cardList.map((c) => c.id);

  if (cardIds.length === 0) {
    return (
      <div className="max-w-4xl space-y-5 pb-16">
        <PageHeader isCorporateOwner={isCorporateOwner} />
        <EmptyState
          title="No card yet"
          body="Create a card to start seeing how people find and use it."
          action={{ label: "Create a card", href: "/templates" }}
        />
      </div>
    );
  }

  const since = rangeToSince(range);
  let query = supabase
    .from("card_taps")
    .select("event_type, created_at, card_profile_id, nfc_card_id, source")
    .in("card_profile_id", cardIds)
    .order("created_at", { ascending: false })
    .limit(ROW_CAP);
  if (since) query = query.gte("created_at", since.toISOString());

  const { data: tapRows } = await query;
  const rows = (tapRows ?? []) as TapRow[];

  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 90;
  const summary = summarize(rows, days);

  const { data: nfcCards } = await supabase
    .from("nfc_cards")
    .select("id, created_at")
    .in("card_profile_id", cardIds);
  const nfcBreakdown = summarizeByNfcCard(rows, nfcCards ?? []);
  const hasNfc = (nfcCards?.length ?? 0) > 0;

  const cardBreakdown =
    cardList.length > 1 ? summarizeByCard(rows, cardList).sort((a, b) => b.views - a.views) : [];

  const hasAnyActivity = rows.length > 0;

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <PageHeader isCorporateOwner={isCorporateOwner} />

      <TimeRangeTabs active={range} />

      {!hasAnyActivity ? (
        <EmptyState
          title="No activity yet in this window"
          body="Share your card or tap it against a phone — activity shows up here as it happens."
        />
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Eye} label="Views" value={summary.views} />
            <Stat icon={MessageCircle} label="Contact actions" value={summary.contactActions} />
            <Stat icon={Share2} label="Shares" value={summary.shares} />
            <Stat
              icon={SmartphoneNfc}
              label="NFC activity"
              value={summary.nfcActivity}
              hint={hasNfc ? undefined : "No NFC card linked yet"}
            />
          </div>

          {/* Engagement rate — only shown once there's enough signal to mean anything */}
          <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sc-surface-2 text-sc-gold-text">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-black text-sc-text">
                  {summary.engagementRate === null
                    ? "Not enough views yet"
                    : `${Math.round(summary.engagementRate * 100)}% engagement rate`}
                </p>
                <p className="app-sub mt-0.5 text-[13px]">
                  Contact actions ÷ views — phone, email, WhatsApp, booking, and saved contacts count; shares and QR opens don&apos;t.
                </p>
              </div>
            </div>
          </div>

          {/* Trends */}
          <div className="app-panel app-panel-pad">
            <h2 className="app-h2 mb-4">Trends</h2>
            <TrendChart series={summary.dailySeries} />
          </div>

          {/* Event breakdown */}
          {summary.eventDistribution.length > 0 && (
            <div className="app-panel app-panel-pad">
              <h2 className="app-h2 mb-4">What visitors did</h2>
              <div className="space-y-2.5">
                {summary.eventDistribution.map((e) => {
                  const max = summary.eventDistribution[0].count;
                  const pct = Math.max(4, (e.count / max) * 100);
                  return (
                    <div key={e.eventType} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-[12px] font-semibold text-sc-text-dim">
                        {EVENT_LABELS[e.eventType]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-sc-surface-2">
                        <div
                          className="h-full rounded-full bg-sc-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[12px] font-bold tabular-nums text-sc-text">
                        {e.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cards — only for multi-card accounts, individual or corporate */}
          {cardBreakdown.length > 0 && (
            <div className="space-y-3">
              <h2 className="app-h2">
                {isCorporateOwner ? "Team cards" : "Your cards"}
              </h2>
              <div className="app-panel overflow-x-auto">
                <table className="app-table w-full">
                  <thead className="border-b border-sc-border-soft">
                    <tr>
                      <th>Card</th>
                      <th>Views</th>
                      <th>Interactions</th>
                      <th>NFC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sc-border-soft">
                    {cardBreakdown.map((c) => (
                      <tr key={c.cardProfileId}>
                        <td data-label="Card">
                          <Link
                            href={`/u/${c.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sc-text hover:text-sc-gold-text"
                          >
                            {c.label}
                          </Link>
                        </td>
                        <td data-label="Views" className="tabular-nums">{c.views}</td>
                        <td data-label="Interactions" className="tabular-nums">{c.interactions}</td>
                        <td data-label="NFC" className="tabular-nums">{c.nfcActivity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NFC breakdown — only when there's more than one physical card to distinguish */}
          {hasNfc && nfcBreakdown.length > 1 && (
            <div className="space-y-3">
              <h2 className="app-h2">NFC cards</h2>
              <div className="app-panel divide-y divide-sc-border-soft">
                {nfcBreakdown.map((nc) => (
                  <div key={nc.nfcCardId} className="flex items-center justify-between p-3.5">
                    <span className="flex items-center gap-2.5 text-[13px] font-semibold text-sc-text">
                      <SmartphoneNfc className="h-4 w-4 text-sc-gold-text" />
                      {nc.label}
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-sc-text-dim">
                      {nc.activity} tap{nc.activity === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PageHeader({ isCorporateOwner }: { isCorporateOwner: boolean }) {
  return (
    <div>
      <h1 className="app-h1">Analytics</h1>
      <p className="app-sub mt-1">
        {isCorporateOwner
          ? "How your team's cards are performing."
          : "How people find and use your card."}
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="app-panel app-panel-pad">
      <Icon className="mb-3 h-4 w-4 text-sc-gold-text" />
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-sc-text">{value}</p>
      <p className="app-sub mt-0.5">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-sc-text-dimmer">{hint}</p>}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  /** Only the "no card at all" state needs one — "no activity yet" already
   *  implies the action (share the card you have), so it stays actionless. */
  action?: { label: string; href: string };
}) {
  return (
    <div className="app-panel app-panel-pad flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sc-surface-2 text-sc-gold-text">
        <MousePointerClick className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[15px] font-black text-sc-text">{title}</p>
        <p className="app-sub mx-auto mt-1 max-w-sm">{body}</p>
      </div>
      {action && (
        <Link href={action.href} className="app-btn app-btn-primary mt-1">
          {action.label}
        </Link>
      )}
    </div>
  );
}
