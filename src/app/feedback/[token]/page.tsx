import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { initialsOf } from "@/lib/card";
import FeedbackView, { type FeedbackItem } from "@/components/feedback/FeedbackView";

export const dynamic = "force-dynamic";

// A private link: never indexed, never previewed with the business's data.
export const metadata: Metadata = {
  title: "Customer feedback",
  robots: { index: false, follow: false },
};

type Payload = {
  business: { full_name: string; username: string; logo_url: string | null; accent_color: string | null };
  ratings: Record<string, number>;
  google_clicks: number;
  feedback: (Omit<FeedbackItem, "card"> & {
    card_serial: number | null;
    card_nickname: string | null;
    card_location: string | null;
  })[];
};

/**
 * What a business sees from the link it was given — no account needed.
 * Everything comes from one SECURITY DEFINER function that answers for
 * exactly one token; review_settings and review_feedback stay closed to
 * anonymous reads, and an unknown token returns nothing at all.
 */
export default async function PrivateFeedback({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32,128}$/.test(token)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("review_feedback_by_token", { p_token: token });
  const payload = data as Payload | null;
  if (!payload?.business) notFound();

  const dist = [0, 0, 0, 0, 0, 0];
  for (const [k, v] of Object.entries(payload.ratings ?? {})) {
    const n = Number(k);
    if (n >= 1 && n <= 5) dist[n] = Number(v);
  }
  const items: FeedbackItem[] = (payload.feedback ?? []).map((f) => ({
    ...f,
    card: f.card_serial != null ? { serial: f.card_serial, nickname: f.card_nickname, location: f.card_location } : null,
  }));
  const { business } = payload;

  return (
    <div className="min-h-screen bg-sc-bg font-sans text-sc-text">
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-[max(2rem,env(safe-area-inset-top))] sm:px-6">
        <header className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sc-border-soft bg-white">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-lg font-black" style={{ color: business.accent_color ?? "#111" }}>
                {initialsOf(business.full_name)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">customer feedback</p>
            <h1 className="truncate text-2xl font-black">{business.full_name}</h1>
          </div>
        </header>

        <p className="app-sub">
          Ratings and messages from your Scorlyn review card. This page is private — only people with this link can
          see it.
        </p>

        <FeedbackView dist={dist} googleClicks={Number(payload.google_clicks ?? 0)} items={items} capped={items.length === 200} />

        <p className="pt-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-sc-text-dimmer">
          Powered by ScorlynTap
        </p>
      </div>
    </div>
  );
}
