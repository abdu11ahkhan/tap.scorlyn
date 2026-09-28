import Link from "next/link";
import { headers } from "next/headers";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ReviewConfig } from "@/lib/card";
import ReviewRow, { type ReviewRowData } from "./ReviewRow";

export const dynamic = "force-dynamic";

/**
 * Every Review Card in one place: its Google link, where feedback goes, and
 * the private link to hand the business so it can read its own feedback
 * without an account.
 */
export default async function AdminReviews() {
  const supabase = await createClient();
  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const { data: cards, error } = await supabase
    .from("card_profiles")
    .select("id, username, full_name, published, review_config")
    .eq("template", "review")
    .order("created_at", { ascending: false });

  const list = cards ?? [];
  const ids = list.map((c) => c.id);

  const [{ data: settings }, { data: events }, { data: feedback }] = ids.length
    ? await Promise.all([
        supabase.from("review_settings").select("card_profile_id, share_token, notify_email, notify_whatsapp").in("card_profile_id", ids),
        supabase
          .from("card_taps")
          .select("card_profile_id, event_type, target")
          .in("card_profile_id", ids)
          .in("event_type", ["rating", "review_click"])
          .limit(50000),
        supabase.from("review_feedback").select("card_profile_id").in("card_profile_id", ids).limit(50000),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const settingsBy = new Map((settings ?? []).map((s) => [s.card_profile_id, s]));
  const stats = new Map<string, { sum: number; n: number; google: number; feedback: number }>();
  const stat = (id: string) => {
    if (!stats.has(id)) stats.set(id, { sum: 0, n: 0, google: 0, feedback: 0 });
    return stats.get(id)!;
  };
  for (const e of events ?? []) {
    const s = stat(e.card_profile_id);
    if (e.event_type === "rating") {
      const n = Number(e.target);
      if (n >= 1 && n <= 5) {
        s.sum += n;
        s.n++;
      }
    } else s.google++;
  }
  for (const f of feedback ?? []) stat(f.card_profile_id).feedback++;

  const rows: ReviewRowData[] = list.map((c) => {
    const s = stats.get(c.id);
    const st = settingsBy.get(c.id);
    return {
      id: c.id,
      username: c.username,
      fullName: c.full_name,
      published: c.published !== false,
      googleUrl: (c.review_config as ReviewConfig | null)?.google_url ?? "",
      notifyEmail: st?.notify_email ?? "",
      notifyWhatsapp: st?.notify_whatsapp ?? "",
      token: st?.share_token ?? null,
      ratings: s?.n ?? 0,
      average: s?.n ? s.sum / s.n : 0,
      googleClicks: s?.google ?? 0,
      feedback: s?.feedback ?? 0,
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="app-h1">Reviews</h1>
          <p className="app-sub mt-1 max-w-2xl">
            Review Cards: 4–5 stars go straight to the business&apos;s Google page, 1–3 stars leave private feedback
            first. Feedback is emailed to the business and shown on its private link.
          </p>
        </div>
        <Link
          href="/admin/users/new?template=review"
          className="sticker sticker-press inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 text-sm font-black uppercase tracking-tight text-ink"
        >
          <Plus className="h-4 w-4" /> new review card
        </Link>
      </div>

      {error && <div className="app-panel app-panel-pad text-sm font-medium text-hotpink">{error.message}</div>}

      {rows.length === 0 ? (
        <div className="app-panel app-panel-pad text-center">
          <p className="text-sm font-bold">No review cards yet.</p>
          <p className="mt-1 text-xs font-semibold text-sc-text-dimmer">
            Create one with the button above, or switch any customer&apos;s card to the Review Card template.
          </p>
        </div>
      ) : (
        rows.map((row) => <ReviewRow key={row.id} row={row} origin={origin} />)
      )}
    </div>
  );
}
