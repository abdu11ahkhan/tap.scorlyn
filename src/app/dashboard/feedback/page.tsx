import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatSerial } from "@/lib/card-codes";

export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string;
  card_profile_id: string;
  rating: number;
  category: string | null;
  message: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  source: string;
  created_at: string;
  nfc_cards: { serial: number; nickname: string | null; location: string | null } | null;
};

const RANGES = { "7d": 7, "30d": 30, "90d": 90, all: null } as const;
type Range = keyof typeof RANGES;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function Stars({ n, size = "h-4 w-4" }: { n: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={size}
          strokeWidth={1.6}
          style={{ color: i <= n ? "#F5A524" : "var(--color-sc-border, #444)", fill: i <= n ? "#F5A524" : "transparent" }}
        />
      ))}
    </span>
  );
}

/**
 * What customers said on Review Cards. Which cards count is decided by the
 * session alone (user_id, or org_owner_id for a company account) — the same
 * columns RLS checks — so nothing in the URL can widen it.
 */
export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; card?: string }>;
}) {
  const params = await searchParams;
  const range: Range = params.range && params.range in RANGES ? (params.range as Range) : "30d";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle();
  const isCorporateOwner = profile?.account_type === "corporate";

  const { data: cards } = await supabase
    .from("card_profiles")
    .select("id, username, full_name, template")
    .eq(isCorporateOwner ? "org_owner_id" : "user_id", user.id);

  const all = cards ?? [];
  const chosen = all.find((c) => c.id === params.card);
  const ids = chosen ? [chosen.id] : all.map((c) => c.id);
  const days = RANGES[range];
  const since = days ? daysAgo(days) : null;

  const header = (
    <div>
      <h1 className="app-h1">Customer feedback</h1>
      <p className="app-sub mt-1 max-w-2xl">
        Ratings and messages from your Review Cards. Feedback here is private to you — every customer is also offered
        your Google review link, whatever they rated.
      </p>
    </div>
  );

  if (!ids.length) {
    return (
      <div className="max-w-4xl space-y-5 pb-16">
        {header}
        <div className="app-panel app-panel-pad py-12 text-center">
          <p className="text-[15px] font-black">No card yet</p>
          <p className="app-sub mx-auto mt-1 max-w-sm">Pick the Review Card template to start collecting ratings.</p>
          <Link href="/templates" className="app-btn app-btn-primary mt-4 inline-flex">
            Browse templates
          </Link>
        </div>
      </div>
    );
  }

  let eventsQuery = supabase
    .from("card_taps")
    .select("event_type, target")
    .in("card_profile_id", ids)
    .in("event_type", ["rating", "review_click", "feedback_submit"])
    .limit(20000);
  if (since) eventsQuery = eventsQuery.gte("created_at", since);

  let feedbackQuery = supabase
    .from("review_feedback")
    .select(
      "id, card_profile_id, rating, category, message, contact_name, contact_phone, contact_email, source, created_at, nfc_cards(serial, nickname, location)"
    )
    .in("card_profile_id", ids)
    .order("created_at", { ascending: false })
    .limit(200);
  if (since) feedbackQuery = feedbackQuery.gte("created_at", since);

  const [{ data: events }, { data: feedback }] = await Promise.all([eventsQuery, feedbackQuery]);

  const dist = [0, 0, 0, 0, 0, 0];
  let googleClicks = 0;
  for (const e of events ?? []) {
    if (e.event_type === "rating") {
      const n = Number(e.target);
      if (n >= 1 && n <= 5) dist[n]++;
    } else if (e.event_type === "review_click") googleClicks++;
  }
  const ratings = dist.reduce((a, b) => a + b, 0);
  const average = ratings ? dist.reduce((sum, count, n) => sum + count * n, 0) / ratings : 0;
  const peak = Math.max(1, ...dist);
  const rows = (feedback ?? []) as unknown as FeedbackRow[];
  const nameOf = new Map(all.map((c) => [c.id, c.full_name]));

  const hrefFor = (patch: { range?: string; card?: string }) => {
    const p = new URLSearchParams();
    const r = patch.range ?? range;
    const c = patch.card ?? params.card ?? "";
    if (r !== "30d") p.set("range", r);
    if (c) p.set("card", c);
    const s = p.toString();
    return `/dashboard/feedback${s ? `?${s}` : ""}`;
  };

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      {header}

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(RANGES) as Range[]).map((r) => (
          <Link
            key={r}
            href={hrefFor({ range: r })}
            className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 text-xs font-black lowercase ${
              range === r ? "border-sc-gold bg-sc-gold text-sc-gold-ink" : "border-sc-border text-sc-text-dim hover:text-sc-text"
            }`}
          >
            {r === "all" ? "all time" : `last ${r.replace("d", " days")}`}
          </Link>
        ))}
        {all.length > 1 && (
          <form action="/dashboard/feedback" className="ml-auto flex gap-2">
            {range !== "30d" && <input type="hidden" name="range" value={range} />}
            <select
              name="card"
              defaultValue={params.card ?? ""}
              aria-label="Card"
              className="h-11 rounded-full border-2 border-sc-border bg-sc-surface-2 px-4 text-sm font-bold text-sc-text"
            >
              <option value="">All cards</option>
              {all.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <button type="submit" className="app-btn min-h-11">show</button>
          </form>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <section className="app-panel app-panel-pad">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">ratings</p>
              <p className="mt-1 text-3xl font-black">
                {ratings ? average.toFixed(1) : "—"} <span className="text-base text-sc-text-dim">/ 5</span>
              </p>
            </div>
            <p className="text-sm font-bold text-sc-text-dim">{ratings.toLocaleString()} rating{ratings === 1 ? "" : "s"}</p>
          </div>
          <div className="mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <Stars n={n} size="h-3.5 w-3.5" />
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sc-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${(dist[n] / peak) * 100}%`, background: "#F5A524" }} />
                </div>
                <span className="w-10 text-right text-sm font-black tabular-nums">{dist[n]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="app-panel app-panel-pad">
            <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">went on to google</p>
            <p className="mt-1 text-3xl font-black">{googleClicks.toLocaleString()}</p>
            <p className="text-xs font-semibold text-sc-text-dimmer">taps on your Google review button</p>
          </div>
          <div className="app-panel app-panel-pad">
            <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">written feedback</p>
            <p className="mt-1 text-3xl font-black">{rows.length.toLocaleString()}</p>
            <p className="text-xs font-semibold text-sc-text-dimmer">{rows.length === 200 ? "showing the latest 200" : "in this period"}</p>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">feedback</h2>
        {rows.length === 0 ? (
          <div className="app-panel app-panel-pad flex flex-col items-center gap-2 py-10 text-center">
            <MessageSquare className="h-5 w-5 text-sc-text-dimmer" />
            <p className="text-sm font-bold">No written feedback in this period.</p>
          </div>
        ) : (
          rows.map((f) => (
            <article key={f.id} className="app-panel app-panel-pad space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars n={f.rating} />
                <time className="text-xs font-semibold text-sc-text-dimmer" dateTime={f.created_at}>
                  {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </div>
              {f.message && <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed">&ldquo;{f.message}&rdquo;</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-sc-text-dim">
                {f.category && <span>Topic: {f.category}</span>}
                {f.nfc_cards && (
                  <span>
                    Card: {formatSerial(f.nfc_cards.serial)}
                    {f.nfc_cards.nickname ? ` · ${f.nfc_cards.nickname}` : ""}
                    {f.nfc_cards.location ? ` · ${f.nfc_cards.location}` : ""}
                  </span>
                )}
                {all.length > 1 && <span>{nameOf.get(f.card_profile_id)}</span>}
              </div>
              {(f.contact_name || f.contact_phone || f.contact_email) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-sc-border-soft pt-2 text-xs font-bold">
                  {f.contact_name && <span>{f.contact_name}</span>}
                  {f.contact_phone && (
                    <a href={`tel:${f.contact_phone}`} className="text-sc-gold-text hover:underline">
                      {f.contact_phone}
                    </a>
                  )}
                  {f.contact_email && (
                    <a href={`mailto:${f.contact_email}`} className="text-sc-gold-text hover:underline">
                      {f.contact_email}
                    </a>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
