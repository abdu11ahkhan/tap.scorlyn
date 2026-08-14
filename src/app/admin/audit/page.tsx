import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  actor_email: string | null;
  action: string;
  entity_label: string | null;
  entity_id: string | null;
  changed: Record<string, { from: unknown; to: unknown }>;
  created_at: string;
};

/** Values are jsonb, so anything can come back. Keep it short and readable. */
function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 40 ? `${text.slice(0, 40)}…` : text || "—";
}

/**
 * Who changed what on someone else's card.
 *
 * Written by a database trigger, not by the console, so it also catches an
 * admin writing straight to the API. Read-only by design: an audit trail its
 * subjects can edit is not an audit trail.
 */
export default async function AdminAudit() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_audit")
    .select("id, actor_email, action, entity_label, entity_id, changed, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const entries = (data ?? []) as Entry[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Audit trail</h1>
        <p className="app-sub mt-1">
          Every change an admin made to a customer&apos;s card. Customers
          editing their own cards are not listed.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="app-panel app-panel-pad text-center">
          <p className="text-sm font-black text-white">Nothing recorded yet</p>
          <p className="mt-1 text-sm font-semibold text-white/45">
            Entries appear here the moment an admin edits a card that is not
            their own.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="app-panel app-panel-pad">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-black text-white">
                  {entry.actor_email ?? "unknown admin"}{" "}
                  <span className="font-semibold text-white/45">
                    {entry.action}d
                  </span>{" "}
                  {entry.entity_id ? (
                    <Link
                      href={`/admin/cards/${entry.entity_id}/edit`}
                      className="text-acid hover:underline"
                    >
                      @{entry.entity_label ?? "card"}
                    </Link>
                  ) : (
                    <span>@{entry.entity_label ?? "card"}</span>
                  )}
                </p>
                <span className="text-xs font-semibold tabular-nums text-white/35">
                  {new Date(entry.created_at).toLocaleString("en-GB")}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                {Object.entries(entry.changed ?? {}).map(([field, change]) => (
                  <p key={field} className="text-xs font-semibold text-white/50">
                    <span className="text-white/70">{field}</span>{" "}
                    <span className="text-rose-300/70 line-through">
                      {show(change?.from)}
                    </span>{" "}
                    → <span className="text-acid">{show(change?.to)}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
