import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatSerial } from "@/lib/card-codes";
import DecideButtons from "./DecideButtons";

export const dynamic = "force-dynamic";

type Claim = {
  id: string;
  status: string;
  method: string;
  note: string | null;
  created_at: string;
  decided_at: string | null;
  user_id: string;
  nfc_card_id: string;
  nfc_cards: { serial: number; batch: string | null } | null;
};

function when(v: string | null) {
  return v ? new Date(v).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

/**
 * Customers asking to activate a physical card they scanned. Approving links
 * the card to their account and they choose what it opens; rejecting puts it
 * back on sale. Cards activated with the packaging code never wait here —
 * they're listed under "recent" as instant.
 */
export default async function CardRequests() {
  const supabase = await createClient();
  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase
      .from("card_claims")
      .select("id, status, method, note, created_at, decided_at, user_id, nfc_card_id, nfc_cards(serial, batch)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("card_claims")
      .select("id, status, method, note, created_at, decided_at, user_id, nfc_card_id, nfc_cards(serial, batch)")
      .neq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const all = [...((pending ?? []) as unknown as Claim[]), ...((recent ?? []) as unknown as Claim[])];
  const ids = [...new Set(all.map((c) => c.user_id))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", ids)
    : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
  const person = new Map((people ?? []).map((p) => [p.id, p]));
  const label = (c: Claim) => person.get(c.user_id)?.full_name || person.get(c.user_id)?.email || "Customer";

  const waiting = (pending ?? []) as unknown as Claim[];
  const done = (recent ?? []) as unknown as Claim[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Card requests</h1>
        <p className="app-sub mt-1 max-w-2xl">
          People who scanned a card that&apos;s ready to sell and asked to activate it. Approve to give them the card —
          they then choose what it opens. Customers with the packaging code skip this and activate instantly.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">waiting for you · {waiting.length}</h2>
        {waiting.length === 0 ? (
          <p className="app-panel app-panel-pad text-center text-sm font-semibold text-sc-text-dimmer">Nothing waiting.</p>
        ) : (
          waiting.map((c) => {
            const p = person.get(c.user_id);
            return (
              <article key={c.id} className="app-panel app-panel-pad grid gap-4 sm:grid-cols-[1fr_minmax(0,320px)]">
                <div className="space-y-1">
                  <p className="text-lg font-black">{p?.full_name || "New customer"}</p>
                  <p className="text-sm font-semibold text-sc-text-dim">{p?.email ?? "—"}</p>
                  <p className="text-xs font-semibold text-sc-text-dimmer">
                    wants{" "}
                    <Link href={`/admin/nfc/${c.nfc_card_id}`} className="font-mono font-bold text-sc-text hover:text-acid">
                      {c.nfc_cards ? formatSerial(c.nfc_cards.serial) : "a card"}
                    </Link>
                    {c.nfc_cards?.batch ? ` · ${c.nfc_cards.batch}` : ""} · asked {when(c.created_at)}
                  </p>
                  <Link href={`/admin/users/${c.user_id}`} className="inline-block pt-1 text-xs font-bold text-sc-text-dim hover:text-acid">
                    view customer →
                  </Link>
                </div>
                <DecideButtons claimId={c.id} who={label(c)} />
              </article>
            );
          })
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">recent</h2>
          <div className="app-panel overflow-x-auto">
            <table className="app-table w-full">
              <thead className="border-b border-sc-border-soft">
                <tr>
                  <th>Card</th>
                  <th>Customer</th>
                  <th>Result</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sc-border-soft">
                {done.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Card" className="font-mono text-sm font-bold">
                      <Link href={`/admin/nfc/${c.nfc_card_id}`} className="hover:text-acid">
                        {c.nfc_cards ? formatSerial(c.nfc_cards.serial) : "—"}
                      </Link>
                    </td>
                    <td data-label="Customer" className="text-sm font-semibold">{label(c)}</td>
                    <td data-label="Result" className="text-sm font-bold">
                      {c.status === "approved" ? (c.method === "code" ? "Activated with code" : "Approved") : c.status === "rejected" ? "Rejected" : "Cancelled"}
                      {c.note ? <span className="block text-xs font-medium text-sc-text-dimmer">{c.note}</span> : null}
                    </td>
                    <td data-label="When" className="text-sm font-semibold tabular-nums text-sc-text-dim">{when(c.decided_at ?? c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
