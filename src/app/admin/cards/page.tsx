import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
      "id, username, full_name, headline, template, published, owner_suspended, created_at, accent_color",
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
          <table className="app-table w-full min-w-[720px]">
            <thead className="border-b border-white/8">
              <tr>
                <th>Card</th>
                <th>Template</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {cards.map((card) => (
                <tr key={card.id} className="transition-colors hover:bg-white/[0.03]">
                  <td>
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
                  <td className="text-sm font-bold lowercase text-white/70">
                    {templateName(card.template)}
                  </td>
                  <td>
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
                  <td className="text-sm font-semibold tabular-nums text-white/45">
                    {new Date(card.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/u/${card.username}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 px-3.5 py-2 text-xs font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      open
                    </Link>
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
