import Link from "next/link";
import { ExternalLink, Pencil, Printer, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ActionButton from "../ActionButton";
import ConfirmByName from "../ConfirmByName";
import { deleteCard, setCardApproval } from "../actions";
import { CARD_TEMPLATES } from "@/lib/card";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type CardRow = {
  id: string;
  username: string;
  full_name: string;
  headline: string | null;
  template: string;
  published: boolean;
  owner_suspended: boolean;
  created_at: string;
  accent_color: string | null;
  /** The physical card they chose at publish, if they have. */
  nfc_finish: string | null;
  nfc_chosen_at: string | null;
  /** Set when they sent us their own print file. */
  nfc_artwork_path: string | null;
  approval_status: string;
  approval_fee_pkr: number | null;
};

export default async function AdminCards({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("card_profiles")
    .select(
      "id, username, full_name, headline, template, published, owner_suspended, created_at, accent_color, nfc_finish, nfc_chosen_at, nfc_artwork_path, approval_status, approval_fee_pkr",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (q?.trim()) {
    // ilike on both name and handle — admins search for whichever they know.
    const term = `%${q.trim()}%`;
    query = query.or(`username.ilike.${term},full_name.ilike.${term}`);
  }

  const { data, count, error } = await query;
  const cards: CardRow[] = data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const templateName = (id: string) =>
    CARD_TEMPLATES.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="app-h1">Cards</h1>
          <p className="app-sub mt-1">
            {total} {total === 1 ? "card" : "cards"} across all accounts.
          </p>
        </div>

        {/* GET form: search state lives in the URL so it survives a refresh
            and can be linked to. */}
        <form method="get" className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="name or @handle"
              className="app-input w-56 pl-9"
            />
          </div>
          <button
            type="submit"
            className="app-btn app-btn-primary"
          >
            search
          </button>
        </form>
      </div>

      {error && (
        <div className="app-panel app-panel-pad text-[13px] font-medium text-hotpink">
          {error.message}
        </div>
      )}

      {cards.length === 0 ? (
        <p className="app-panel app-panel-pad text-center text-[13px] text-white/35">
          No cards match that.
        </p>
      ) : (
        <div className="app-panel overflow-x-auto">
          <table className="app-table w-full md:min-w-[720px]">
            <thead className="border-b border-white/8">
              <tr>
                <th>Card</th>
                <th>Template</th>
                <th>NFC card</th>
                <th>Approval</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {cards.map((card) => (
                <tr key={card.id} className="transition-colors hover:bg-white/[0.03]">
                  <td data-label="Card">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-8 shrink-0 rounded-full border-2 border-ink"
                        style={{ background: card.accent_color || "#111111" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-black">{card.full_name}</p>
                        <p className="truncate text-xs font-semibold text-white/40">
                          @{card.username}
                          {card.headline ? ` · ${card.headline}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td data-label="NFC card" className="text-sm font-bold lowercase">
                    {card.nfc_finish ? (
                      // Straight to the print sheet: the whole point is that
                      // admin can get from "who is waiting" to "send this to
                      // the printer" without hunting for an order.
                      <Link
                        href={`/admin/cards/${card.id}/artwork`}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-acid/40 px-3 py-1.5 text-xs font-black text-acid transition-colors hover:bg-acid/10"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        {card.nfc_artwork_path ? "own file" : card.nfc_finish}
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-white/25">
                        not chosen
                      </span>
                    )}
                  </td>
                  <td data-label="Template" className="text-sm font-bold lowercase text-white/70">
                    {templateName(card.template)}
                  </td>
                  <td data-label="Approval" className="text-sm">
                    {card.approval_status === "approved" ? (
                      <span className="text-xs font-bold text-white/35">approved</span>
                    ) : (
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-black uppercase text-amber-300">
                          {card.approval_status === "awaiting_payment"
                            ? `Rs.${card.approval_fee_pkr ?? 500} unpaid`
                            : card.approval_status === "awaiting_review"
                              ? "check payment"
                              : "rejected"}
                        </span>
                        {/* The only route from built to live: the trigger
                            stops the customer publishing it themselves. */}
                        <ActionButton
                          action={async () => {
                            "use server";
                            return setCardApproval(card.id, "approved");
                          }}
                          variant="acid"
                          confirm="Approve this card so the customer can publish it?"
                        >
                          approve
                        </ActionButton>
                      </div>
                    )}
                  </td>
                  <td data-label="Status">
                    {/* Suspension outranks published: a suspended owner's card
                        is off the internet however the flag reads. Showing
                        "live" here is what hid the fact that suspension was
                        doing nothing at all. */}
                    <span
                      className={`rounded-full border-2 border-ink px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                        card.owner_suspended
                          ? "bg-hotpink text-white"
                          : card.published
                            ? "bg-acid text-ink"
                            : "bg-white/15 text-white/60"
                      }`}
                    >
                      {card.owner_suspended
                        ? "suspended"
                        : card.published
                          ? "live"
                          : "hidden"}
                    </span>
                  </td>
                  <td data-label="Created" className="text-sm font-semibold tabular-nums text-white/45">
                    {new Date(card.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td data-label="" className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/u/${card.username}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 px-3.5 py-2 text-xs font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        open
                      </Link>
                      {/* Straight into their card. Most support here happens
                          over WhatsApp, where the customer sends details and
                          expects someone else to type them in. */}
                      <Link
                        href={`/admin/cards/${card.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 px-3.5 py-2 text-xs font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        edit
                      </Link>
                      {/* Typing the handle is the guard: this frees the name
                          for anyone else and cannot be undone. */}
                      <ConfirmByName
                        action={async () => {
                          "use server";
                          return deleteCard(card.id);
                        }}
                        expected={card.username}
                        title="Delete this card"
                        body={`Takes /u/${card.username} down and releases the handle. The person keeps their account and can build a new card. Type the handle to confirm.`}
                        cta="delete card"
                        variant="danger"
                      >
                        delete
                      </ConfirmByName>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white/40">
            Page {currentPage} of {pages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/cards?page=${currentPage - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="app-btn app-btn-ghost"
              >
                previous
              </Link>
            )}
            {currentPage < pages && (
              <Link
                href={`/admin/cards?page=${currentPage + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="app-btn app-btn-ghost"
              >
                next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
