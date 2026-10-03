import Link from "next/link";
import { headers } from "next/headers";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cardUrl, formatActivationCode, formatSerial } from "@/lib/card-codes";
import CreateControls from "./CreateControls";
import BulkDownloads, { type ExportCard } from "./BulkDownloads";
import StatusBadge from "./StatusBadge";
import ReleaseToggle from "./ReleaseToggle";
import { SORTS, STATUS_FILTERS, experienceOf, loadCards } from "./load-cards";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "—";
}

export default async function AdminCards({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; batch?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = STATUS_FILTERS.some((s) => s.id === params.status) ? params.status! : "all";
  const sort = SORTS.some((s) => s.id === params.sort) ? params.sort! : "created";
  const q = (params.q ?? "").slice(0, 60);
  const batch = params.batch && /^[0-9a-f-]{36}$/.test(params.batch) ? params.batch : undefined;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  // The chip is written once and then posted to someone, so a stale domain
  // here means a dead card. Whatever host the admin is on is the host the tag
  // should point at.
  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const supabase = await createClient();

  let cards: Awaited<ReturnType<typeof loadCards>> = [];
  let loadError: string | null = null;
  try {
    cards = await loadCards(supabase, { status, q, batch, sort });
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load cards.";
  }

  const [{ data: batchRow }, { data: batches }] = await Promise.all([
    batch
      ? supabase.from("nfc_card_batches").select("id, name, product_type, quantity, created_at").eq("id", batch).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("nfc_card_batches").select("id, name").order("created_at", { ascending: false }).limit(50),
  ]);

  const pages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const shown = cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCards: ExportCard[] = cards.map((c) => ({
    serial: formatSerial(c.serial),
    url: cardUrl(origin, c.card_url, "qr"),
    nfcUrl: cardUrl(origin, c.card_url, "nfc"),
    code: c.card_url,
    batchId: c.batch_id,
    batch: c.batch,
    status: c.status,
    activation: formatActivationCode(c.activation_code),
  }));
  const inStockIds = cards.filter((c) => c.status === "in_stock").map((c) => c.id);

  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status, q, batch, sort, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v && !(k === "status" && v === "all") && !(k === "sort" && v === "created")) next.set(k, v);
    }
    const s = next.toString();
    return `/admin/nfc${s ? `?${s}` : ""}`;
  };

  const printParams = new URLSearchParams();
  if (batch) printParams.set("batch", batch);
  else printParams.set("status", status === "all" ? "in_stock" : status);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Physical cards</h1>
        <p className="app-sub mt-1 max-w-2xl">
          Physical NFC + QR cards. Generate stock, print it, and assign each card to a business
          when it sells — the code on the card never changes, only what it opens.
        </p>
      </div>

      <CreateControls printHref={`/admin/nfc/print?${printParams}`} />

      <div className="app-panel app-panel-pad">
        <p>what goes on every card — chip and QR alike</p>
        <p className="mt-2 break-all font-mono text-sm text-acid">{origin}/api/nfc/&lt;code&gt;</p>
        <p className="mt-2 text-sm font-medium text-sc-text-dim">
          That endpoint looks the card up and redirects, so a card can be reassigned without
          rewriting the chip or reprinting the QR. Lock the tag once written — an unlocked NTAG can
          be repointed by anyone.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
          role="tablist"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s.id}
              href={link({ status: s.id, page: undefined })}
              role="tab"
              aria-selected={status === s.id}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border-2 px-4 text-xs font-black lowercase transition-colors ${
                status === s.id
                  ? "border-acid bg-acid text-ink"
                  : "border-sc-border text-sc-text-dim hover:border-acid hover:text-acid"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <form className="flex flex-wrap items-center gap-2" action="/admin/nfc">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          {batch && <input type="hidden" name="batch" value={batch} />}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-text-dimmer" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Card ID, business, nickname, location, batch"
              className="h-11 w-full rounded-full border-2 border-sc-border-soft bg-sc-surface-2 pl-10 pr-4 text-sm font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-acid"
            />
          </div>
          <select
            name="sort"
            defaultValue={sort}
            aria-label="Sort"
            className="h-11 rounded-full border-2 border-sc-border-soft bg-sc-surface-2 px-4 text-sm font-bold text-sc-text outline-none focus:border-acid"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <select
            name="batch"
            defaultValue={batch ?? ""}
            aria-label="Batch"
            className="h-11 max-w-[220px] rounded-full border-2 border-sc-border-soft bg-sc-surface-2 px-4 text-sm font-bold text-sc-text outline-none focus:border-acid"
          >
            <option value="">All batches</option>
            {(batches ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-sc-border px-5 text-sm font-black lowercase text-sc-text transition-colors hover:border-acid hover:text-acid"
          >
            apply
          </button>
          {(q || batch || status !== "all" || sort !== "created") && (
            <Link href="/admin/nfc" className="text-xs font-bold text-sc-text-dimmer hover:text-acid">
              clear
            </Link>
          )}
        </form>
      </div>

      {batchRow && (
        <div className="app-panel app-panel-pad space-y-3">
          <div>
            <p className="text-lg font-black">{batchRow.name}</p>
            <p className="text-xs font-semibold text-sc-text-dimmer">
              {batchRow.product_type ? `${batchRow.product_type} · ` : ""}
              {batchRow.quantity} cards · created {date(batchRow.created_at)}
            </p>
          </div>
          <BulkDownloads cards={exportCards} label={batchRow.name} />
          <ReleaseToggle cardIds={inStockIds} label={`mark ${inStockIds.length} in-stock cards ready to sell`} />
        </div>
      )}

      {!batchRow && cards.length > 0 && (
        <div className="app-panel app-panel-pad space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-sc-text-dimmer">
            download qr codes for these cards
          </p>
          <BulkDownloads cards={exportCards} label={`cards-${status}`} />
          {inStockIds.length > 0 && (
            <ReleaseToggle cardIds={inStockIds} label={`mark ${inStockIds.length} in-stock cards ready to sell`} />
          )}
        </div>
      )}

      {loadError && (
        <div className="app-panel app-panel-pad text-[13px] font-medium text-hotpink">{loadError}</div>
      )}

      {!loadError && cards.length === 0 ? (
        <div className="app-panel app-panel-pad text-center">
          <p className="text-sm font-bold text-sc-text">
            {q || batch || status !== "all" ? "No cards match these filters." : "No cards yet."}
          </p>
          <p className="mt-1 text-xs font-semibold text-sc-text-dimmer">
            {q || batch || status !== "all"
              ? "Try clearing the search or picking another status."
              : "Create a single card, or a batch to print in bulk."}
          </p>
        </div>
      ) : (
        cards.length > 0 && (
          <div className="app-panel overflow-x-auto">
            <table className="app-table w-full md:min-w-[1080px]">
              <thead className="border-b border-sc-border-soft">
                <tr>
                  <th>Card</th>
                  <th>Status</th>
                  <th>Business</th>
                  <th>Experience</th>
                  <th>Nickname / location</th>
                  <th>Batch</th>
                  <th>Created</th>
                  <th>Assigned</th>
                  <th>Last tap</th>
                  <th className="text-right">Taps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sc-border-soft">
                {shown.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-sc-surface-2">
                    <td data-label="Card">
                      <Link href={`/admin/nfc/${c.id}`} className="block min-h-11 py-1 hover:text-acid">
                        <span className="whitespace-nowrap font-mono text-sm font-black">{formatSerial(c.serial)}</span>
                        <span className="block font-mono text-[11px] font-semibold text-sc-text-dimmer">
                          {c.card_url}
                        </span>
                      </Link>
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={c.status} />
                      {c.status === "in_stock" && c.claimable && (
                        <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-acid">ready to sell</span>
                      )}
                    </td>
                    <td data-label="Business">
                      {c.card_profiles ? (
                        <>
                          <p className="text-sm font-black">{c.card_profiles.full_name}</p>
                          <p className="text-xs font-semibold text-sc-text-dimmer">@{c.card_profiles.username}</p>
                        </>
                      ) : (
                        <span className="text-sc-text-dimmer">—</span>
                      )}
                    </td>
                    <td data-label="Experience" className="text-sm font-semibold text-sc-text-dim">
                      {experienceOf(c) ?? "—"}
                    </td>
                    <td data-label="Nickname / location" className="text-sm font-semibold text-sc-text-dim">
                      {c.nickname || c.location ? (
                        <>
                          {c.nickname && <p className="font-bold text-sc-text">{c.nickname}</p>}
                          {c.location && <p className="text-xs">{c.location}</p>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td data-label="Batch" className="text-sm font-semibold text-sc-text-dim">
                      {c.batch ?? "—"}
                    </td>
                    <td data-label="Created" className="text-sm font-semibold tabular-nums text-sc-text-dim">
                      {date(c.created_at)}
                    </td>
                    <td data-label="Assigned" className="text-sm font-semibold tabular-nums text-sc-text-dim">
                      {date(c.assigned_at)}
                    </td>
                    <td data-label="Last tap" className="text-sm font-semibold tabular-nums text-sc-text-dim">
                      {date(c.last_tap)}
                    </td>
                    <td data-label="Taps" className="text-right text-sm font-black tabular-nums">
                      {c.taps.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm font-bold" aria-label="Pages">
          <span className="text-sc-text-dimmer">
            {cards.length.toLocaleString()} cards · page {page} of {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link
                href={link({ page: String(page - 1) })}
                className="inline-flex min-h-11 items-center rounded-full border-2 border-sc-border px-4 hover:border-acid hover:text-acid"
              >
                previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={link({ page: String(page + 1) })}
                className="inline-flex min-h-11 items-center rounded-full border-2 border-sc-border px-4 hover:border-acid hover:text-acid"
              >
                next
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
