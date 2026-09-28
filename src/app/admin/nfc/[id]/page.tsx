import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveButton, type CardButton } from "@/lib/card";
import { cardUrl, formatSerial } from "@/lib/card-codes";
import QrTools from "../QrTools";
import StatusBadge from "../StatusBadge";
import { experienceOf, type InventoryCard } from "../load-cards";
import AssignForm from "./AssignForm";
import CardActions from "./CardActions";

export const dynamic = "force-dynamic";

type CardEvent = {
  id: string;
  action: string;
  from_username: string | null;
  to_username: string | null;
  from_status: string | null;
  to_status: string | null;
  details: Record<string, string | null> | null;
  created_at: string;
};

/** Midnight 29 days ago — the first bar of a 30-day chart ending today. */
function thirtyDaysAgo(): Date {
  const since = new Date(Date.now() - 29 * 86400000);
  since.setHours(0, 0, 0, 0);
  return since;
}

function when(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
}

function describe(e: CardEvent): string {
  const status = (s: string | null) => (s ?? "").replace("_", " ");
  switch (e.action) {
    case "created":
      return e.to_username ? `Created, assigned to @${e.to_username}` : "Created, in stock";
    case "assigned":
      return `Assigned to @${e.to_username ?? "?"}`;
    case "reassigned":
      return `Moved from @${e.from_username ?? "?"} to @${e.to_username ?? "?"}`;
    case "unassigned":
      return `Unassigned from @${e.from_username ?? "?"}`;
    case "status_changed":
      return `Status ${status(e.from_status)} → ${status(e.to_status)}`;
    case "details_changed": {
      const d = e.details ?? {};
      const parts = [];
      if (d.nickname !== d.old_nickname) parts.push(`nickname "${d.nickname ?? "—"}"`);
      if (d.location !== d.old_location) parts.push(`location "${d.location ?? "—"}"`);
      return `Updated ${parts.join(", ") || "details"}`;
    }
    default:
      return e.action;
  }
}

export default async function AdminCardDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const { data: row } = await supabase
    .from("nfc_cards")
    .select(
      "id, serial, card_url, status, nickname, location, batch, batch_id, created_at, assigned_at, card_profile_id, card_profiles(username, full_name, template, is_single_purpose, buttons, published)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();
  const card = row as unknown as Omit<InventoryCard, "taps" | "first_tap" | "last_tap"> & {
    card_profiles: (InventoryCard["card_profiles"] & { published: boolean }) | null;
  };

  const since = thirtyDaysAgo();

  const [{ data: stats }, { data: recent }, { data: events }, { data: profiles }, { data: batch }] = await Promise.all([
    supabase.rpc("nfc_card_tap_stats", { card_ids: [id] }),
    supabase
      .from("card_taps")
      .select("created_at")
      .eq("nfc_card_id", id)
      .eq("event_type", "view")
      .gte("created_at", since.toISOString())
      .limit(5000),
    supabase
      .from("nfc_card_events")
      .select("id, action, from_username, to_username, from_status, to_status, details, created_at")
      .eq("nfc_card_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("card_profiles").select("username, full_name").order("created_at", { ascending: false }).limit(500),
    card.batch_id
      ? supabase.from("nfc_card_batches").select("name, product_type").eq("id", card.batch_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const stat = (stats ?? [])[0] as { taps: number; first_tap: string; last_tap: string } | undefined;
  const serial = formatSerial(card.serial);
  const url = cardUrl(origin, card.card_url);
  const profile = card.card_profiles;

  const destination = profile
    ? profile.is_single_purpose
      ? resolveButton((profile.buttons?.[0] ?? null) as CardButton | null)?.href ?? "No link set"
      : `${origin}/u/${profile.username}`
    : null;

  // Last 30 days, one bar per day.
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), n: 0 };
  });
  const dayIndex = new Map(days.map((d, i) => [d.key, i]));
  for (const t of recent ?? []) {
    const i = dayIndex.get(new Date(t.created_at).toISOString().slice(0, 10));
    if (i !== undefined) days[i].n++;
  }
  const peak = Math.max(1, ...days.map((d) => d.n));
  const name = card.nickname || serial;

  return (
    <div className="space-y-5">
      <Link href="/admin/nfc" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sc-text-dim hover:text-acid">
        <ArrowLeft className="h-4 w-4" /> all cards
      </Link>

      {created && (
        <div className="app-panel app-panel-pad border-acid/50 text-sm font-bold text-acid">
          Card {serial} created — in stock and ready to print.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">card</p>
          <h1 className="app-h1 font-mono">{serial}</h1>
          {card.nickname && <p className="mt-1 text-sm font-bold text-sc-text-dim">{card.nickname}</p>}
        </div>
        <StatusBadge status={card.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="app-panel app-panel-pad space-y-4">
          <QrTools url={url} serial={serial} />
          <div className="rounded-xl border-2 border-sc-border-soft p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">permanent url</p>
            <p className="mt-1 break-all font-mono text-sm font-bold text-acid">{url}</p>
            <p className="mt-2 text-xs font-medium text-sc-text-dimmer">
              Same URL for the QR and the NFC chip. It never changes, even when the card is reassigned.
            </p>
          </div>
        </section>

        <div className="space-y-5">
          <section className="app-panel app-panel-pad space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">assignment</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">business</dt>
                <dd className="mt-1 text-sm font-black">
                  {profile ? (
                    <>
                      {profile.full_name} <span className="font-semibold text-sc-text-dimmer">@{profile.username}</span>
                      {!profile.published && (
                        <span className="ml-2 text-xs font-bold text-hotpink">(unpublished — taps won&apos;t open it)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sc-text-dimmer">Unassigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">experience</dt>
                <dd className="mt-1 text-sm font-bold">{experienceOf(card) ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">destination</dt>
                <dd className="mt-1 break-all text-sm font-semibold text-sc-text-dim">
                  {destination ? (
                    <a href={destination} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-acid">
                      {destination} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    "Opens the “card not set up yet” page until assigned."
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">batch</dt>
                <dd className="mt-1 text-sm font-semibold text-sc-text-dim">
                  {batch ? `${batch.name}${batch.product_type ? ` · ${batch.product_type}` : ""}` : card.batch ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">created / assigned</dt>
                <dd className="mt-1 text-sm font-semibold text-sc-text-dim">
                  {when(card.created_at)} · {when(card.assigned_at)}
                </dd>
              </div>
            </dl>

            {profile && (
              <p className="text-xs font-semibold text-sc-text-dimmer">
                To change the experience or destination, edit{" "}
                <Link href={`/admin/cards/${card.card_profile_id}/edit`} className="font-bold text-sc-text hover:text-acid">
                  @{profile.username}&apos;s card
                </Link>
                . This card follows it automatically.
              </p>
            )}

            <AssignForm
              cardId={card.id}
              current={{ username: profile?.username ?? null, nickname: card.nickname, location: card.location }}
              profiles={profiles ?? []}
              disabled={card.status === "retired"}
            />
            {card.status === "retired" && (
              <p className="text-xs font-bold text-sc-text-dimmer">Retired cards can&apos;t be assigned. Reactivate it first.</p>
            )}
          </section>

          <section className="app-panel app-panel-pad space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">analytics</h2>
            <p className="text-2xl font-black">
              {name} <span className="text-sc-text-dim">received</span> {Number(stat?.taps ?? 0).toLocaleString()}{" "}
              <span className="text-sc-text-dim">tap{Number(stat?.taps ?? 0) === 1 ? "" : "s"}</span>
            </p>
            <p className="text-xs font-semibold text-sc-text-dimmer">
              First tap {when(stat?.first_tap ?? null)} · last tap {when(stat?.last_tap ?? null)} · NFC and QR counted together
            </p>
            <div>
              <div className="flex h-24 items-end gap-[3px]" role="img" aria-label="Taps per day, last 30 days">
                {days.map((d) => (
                  <div
                    key={d.key}
                    title={`${d.label}: ${d.n}`}
                    className="flex-1 rounded-t-sm bg-acid/80"
                    style={{ height: `${Math.max(d.n ? 6 : 2, (d.n / peak) * 100)}%`, opacity: d.n ? 1 : 0.25 }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-bold text-sc-text-dimmer">
                <span>{days[0].label}</span>
                <span>today</span>
              </div>
            </div>
          </section>

          <section className="app-panel app-panel-pad space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">actions</h2>
            <CardActions cardId={card.id} serial={serial} status={card.status} assigned={Boolean(profile)} />
          </section>

          <section className="app-panel app-panel-pad space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">history</h2>
            {(events ?? []).length === 0 ? (
              <p className="text-sm font-semibold text-sc-text-dimmer">No changes recorded yet.</p>
            ) : (
              <ol className="space-y-2">
                {(events as CardEvent[]).map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-sc-border-soft pb-2 last:border-0">
                    <span className="text-sm font-bold">{describe(e)}</span>
                    <span className="text-xs font-semibold tabular-nums text-sc-text-dimmer">{when(e.created_at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
