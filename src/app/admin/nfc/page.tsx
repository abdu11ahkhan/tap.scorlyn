import { createClient } from "@/lib/supabase/server";
import ActionButton from "../ActionButton";
import { deleteNfcCard } from "../actions";
import IssueForm from "./IssueForm";
import AssignCell from "./AssignCell";

export const dynamic = "force-dynamic";

type CardRow = {
  id: string;
  card_url: string;
  batch: string | null;
  created_at: string;
  card_profile_id: string | null;
  card_profiles: { username: string; full_name: string } | null;
};

export default async function AdminNfc() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfc_cards")
    .select("id, card_url, batch, created_at, card_profile_id, card_profiles(username, full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as CardRow[];
  const assigned = rows.filter((r) => r.card_profile_id).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Nfc stock</h1>
        <p className="app-sub mt-1 max-w-2xl">
          {rows.length} card{rows.length === 1 ? "" : "s"} · {assigned} assigned ·{" "}
          {rows.length - assigned} blank. Issue stock before you print it, then
          attach an owner when it sells.
        </p>
      </div>

      <IssueForm />

      <div className="app-panel app-panel-pad">
        <p >
          what to write on the tag
        </p>
        <p className="mt-2 font-mono text-sm text-acid">
          https://tapzar.vercel.app/api/nfc/&lt;code&gt;
        </p>
        <p className="mt-2 text-sm font-medium text-white/45">
          That endpoint looks the card up and redirects, so you can reassign a
          card to a different person later without rewriting the chip. Lock the
          tag once written — an unlocked NTAG can be repointed by anyone.
        </p>
      </div>

      {error && (
        <div className="app-panel app-panel-pad text-[13px] font-medium text-hotpink">
          {error.message}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="app-panel app-panel-pad text-center text-[13px] text-white/35">
          No cards issued yet.
        </p>
      ) : (
        <div className="app-panel overflow-x-auto">
          <table className="app-table w-full min-w-[820px]">
            <thead className="border-b border-white/8">
              <tr>
                <th>Code</th>
                <th>Batch</th>
                <th>Assigned to</th>
                <th>Issued</th>
                <th className="px-5 py-3.5 text-right">Assign / remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="font-mono text-sm font-bold text-acid">
                    {row.card_url}
                  </td>
                  <td className="text-sm font-semibold text-white/45">
                    {row.batch ?? "—"}
                  </td>
                  <td>
                    {row.card_profiles ? (
                      <>
                        <p className="text-sm font-black">{row.card_profiles.full_name}</p>
                        <p className="text-xs font-semibold text-white/40">
                          @{row.card_profiles.username}
                        </p>
                      </>
                    ) : (
                      <span className="rounded-full border-2 border-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/40">
                        blank
                      </span>
                    )}
                  </td>
                  <td className="text-sm font-semibold tabular-nums text-white/45">
                    {new Date(row.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-start justify-end gap-2">
                      <AssignCell
                        cardId={row.id}
                        current={row.card_profiles?.username ?? null}
                      />
                      <ActionButton
                        action={async () => {
                          "use server";
                          return deleteNfcCard(row.id);
                        }}
                        variant="danger"
                        confirm={`Delete card ${row.card_url}? Any physical tag pointing at it stops working.`}
                      >
                        delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
