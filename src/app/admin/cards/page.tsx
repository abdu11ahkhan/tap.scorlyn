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
      "id, username, full_name, headline, template, published, created_at, accent_color",
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
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">
            cards<span className="text-acid">.</span>
          </h1>
          <p className="mt-2 font-medium text-white/50">
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
              className="h-12 w-60 rounded-full border-2 border-white/15 bg-white/[0.04] pl-10 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid"
            />
          </div>
          <button
            type="submit"
            className="sticker sticker-press h-12 rounded-full border-2 border-ink bg-acid px-6 text-sm font-black uppercase tracking-tight text-ink"
          >
            search
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
          {error.message}
        </div>
      )}

      {cards.length === 0 ? (
        <p className="rounded-2xl border-2 border-white/12 bg-white/[0.03] p-10 text-center font-bold text-white/40">
          No cards match that.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-white/12">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-white/[0.05]">
              <tr className="text-[11px] font-black uppercase tracking-widest text-white/40">
                <th className="px-5 py-3.5">Card</th>
                <th className="px-5 py-3.5">Template</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {cards.map((card) => (
                <tr key={card.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-5 py-4">
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
                  <td className="px-5 py-4 text-sm font-bold lowercase text-white/70">
                    {templateName(card.template)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border-2 border-ink px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                        card.published ? "bg-acid text-ink" : "bg-white/15 text-white/60"
                      }`}
                    >
                      {card.published ? "live" : "hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold tabular-nums text-white/45">
                    {new Date(card.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-4 text-right">
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
                className="rounded-full border-2 border-white/20 px-5 py-2.5 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
              >
                previous
              </Link>
            )}
            {currentPage < pages && (
              <Link
                href={`/admin/cards?page=${currentPage + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="rounded-full border-2 border-white/20 px-5 py-2.5 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
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
