import Link from "next/link";
import { ShieldOff, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Accounts that are no longer active: suspended, and removed.
 *
 * Kept off the main customer list so that list stays a list of people you can
 * actually sell to, while these two still have to be findable — a suspension
 * needs lifting sometimes, and a deletion needs answering for.
 */
export default async function RemovedAccounts() {
  const supabase = await createClient();

  const [{ data: suspended }, { data: deleted }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("suspended", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("deleted_accounts")
      .select("id, email, full_name, username, orders_kept, reason, deleted_at")
      .order("deleted_at", { ascending: false })
      .limit(200),
  ]);

  const when = (v: string) => new Date(v).toLocaleDateString("en-GB");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-h1">Suspended &amp; deleted</h1>
        <p className="app-sub mt-1">
          Accounts that are switched off or gone. Orders are kept either way.
        </p>
      </div>

      <section className="space-y-3">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
          <ShieldOff className="h-3.5 w-3.5" />
          suspended ({suspended?.length ?? 0})
        </p>

        {!suspended?.length ? (
          <p className="app-sub">Nobody is suspended.</p>
        ) : (
          <div className="app-panel overflow-x-auto">
            <table className="app-table w-full md:min-w-[560px]">
              <thead className="border-b border-white/8">
                <tr>
                  <th>Person</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {suspended.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Person">
                      <p className="font-black">{p.full_name || "—"}</p>
                      <p className="text-xs font-semibold text-white/40">{p.email}</p>
                    </td>
                    <td data-label="Joined" className="text-sm text-white/60">
                      {when(p.created_at)}
                    </td>
                    <td data-label="">
                      <Link href={`/admin/users/${p.id}`} className="app-btn app-btn-ghost">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
          <Trash2 className="h-3.5 w-3.5" />
          deleted ({deleted?.length ?? 0})
        </p>

        {!deleted?.length ? (
          <p className="app-sub">No accounts have been deleted.</p>
        ) : (
          <div className="app-panel overflow-x-auto">
            <table className="app-table w-full md:min-w-[680px]">
              <thead className="border-b border-white/8">
                <tr>
                  <th>Person</th>
                  <th>Handle</th>
                  <th>Orders kept</th>
                  <th>Deleted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {deleted.map((d) => (
                  <tr key={d.id}>
                    <td data-label="Person">
                      <p className="font-black">{d.full_name || "—"}</p>
                      <p className="text-xs font-semibold text-white/40">{d.email}</p>
                      {d.reason && (
                        <p className="mt-1 text-xs text-white/45">{d.reason}</p>
                      )}
                    </td>
                    <td data-label="Handle" className="text-sm text-white/60">
                      {d.username ? `@${d.username}` : "—"}
                    </td>
                    <td data-label="Orders kept" className="text-sm text-white/60">
                      {d.orders_kept}
                    </td>
                    <td data-label="Deleted" className="text-sm text-white/60">
                      {when(d.deleted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
