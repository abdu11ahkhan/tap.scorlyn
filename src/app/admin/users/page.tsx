import { ShieldCheck, Ban, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ActionButton from "../ActionButton";
import { setAdmin, setSuspended } from "../actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  suspended: boolean;
  referral_code: string | null;
  created_at: string;
};

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, is_admin, suspended, referral_code, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
  }

  const { data, count, error } = await query;
  const rows: Row[] = data ?? [];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">
            people<span className="text-acid">.</span>
          </h1>
          <p className="mt-2 font-medium text-white/50">
            {count ?? 0} {count === 1 ? "account" : "accounts"}. Grant admin access or
            suspend someone here.
          </p>
        </div>

        <form method="get" className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="name or email"
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

      {rows.length === 0 ? (
        <p className="rounded-2xl border-2 border-white/12 bg-white/[0.03] p-10 text-center font-bold text-white/40">
          No accounts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-white/12">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white/[0.05]">
              <tr className="text-[11px] font-black uppercase tracking-widest text-white/40">
                <th className="px-5 py-3.5">Person</th>
                <th className="px-5 py-3.5">Referral</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {rows.map((row) => {
                const isMe = row.id === me?.id;
                return (
                  <tr key={row.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <p className="font-black">
                        {row.full_name || "—"}
                        {isMe && (
                          <span className="ml-2 rounded-full border-2 border-white/20 px-2 py-0.5 text-[10px] font-black uppercase text-white/50">
                            you
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-semibold text-white/40">{row.email}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-white/50">
                      {row.referral_code ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {row.is_admin && (
                          <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-acid px-2.5 py-1 text-[10px] font-black uppercase text-ink">
                            <ShieldCheck className="h-3 w-3" />
                            admin
                          </span>
                        )}
                        {row.suspended && (
                          <span className="flex items-center gap-1 rounded-full border-2 border-ink bg-hotpink px-2.5 py-1 text-[10px] font-black uppercase text-white">
                            <Ban className="h-3 w-3" />
                            suspended
                          </span>
                        )}
                        {!row.is_admin && !row.suspended && (
                          <span className="text-xs font-bold text-white/35">member</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold tabular-nums text-white/45">
                      {new Date(row.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ActionButton
                          action={async () => {
                            "use server";
                            return setAdmin(row.id, !row.is_admin);
                          }}
                          variant={row.is_admin ? "ghost" : "acid"}
                          confirm={
                            row.is_admin
                              ? `Remove admin access from ${row.email}?`
                              : `Give ${row.email} full admin access?`
                          }
                        >
                          {row.is_admin ? "revoke admin" : "make admin"}
                        </ActionButton>

                        <ActionButton
                          action={async () => {
                            "use server";
                            return setSuspended(row.id, !row.suspended);
                          }}
                          variant="danger"
                          confirm={
                            row.suspended
                              ? `Restore ${row.email}?`
                              : `Suspend ${row.email}? Their card stops being public immediately.`
                          }
                        >
                          {row.suspended ? "restore" : "suspend"}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              <a
                href={`/admin/users?page=${currentPage - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="rounded-full border-2 border-white/20 px-5 py-2.5 text-sm font-black lowercase text-white/70 hover:border-acid hover:text-acid"
              >
                previous
              </a>
            )}
            {currentPage < pages && (
              <a
                href={`/admin/users?page=${currentPage + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="rounded-full border-2 border-white/20 px-5 py-2.5 text-sm font-black lowercase text-white/70 hover:border-acid hover:text-acid"
              >
                next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
