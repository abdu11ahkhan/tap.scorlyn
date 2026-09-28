import { MessageSquare, Star } from "lucide-react";
import { formatSerial } from "@/lib/card-codes";

export type FeedbackItem = {
  id: string;
  rating: number;
  category: string | null;
  message: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
  card: { serial: number; nickname: string | null; location: string | null } | null;
  business?: string | null;
};

export function Stars({ n, size = "h-4 w-4" }: { n: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={size}
          strokeWidth={1.6}
          style={{ color: i <= n ? "#F5A524" : "var(--color-sc-border, #444)", fill: i <= n ? "#F5A524" : "transparent" }}
        />
      ))}
    </span>
  );
}

/**
 * Ratings, Google clicks and written feedback for one or more Review Cards.
 * Shared by the signed-in dashboard page and the private no-login link, so
 * both always show exactly the same thing.
 */
export default function FeedbackView({
  dist,
  googleClicks,
  items,
  capped,
}: {
  /** Index 1–5 = number of ratings with that many stars. */
  dist: number[];
  googleClicks: number;
  items: FeedbackItem[];
  capped?: boolean;
}) {
  const ratings = dist.slice(1).reduce((a, b) => a + b, 0);
  const average = ratings ? dist.reduce((sum, count, n) => sum + count * n, 0) / ratings : 0;
  const peak = Math.max(1, ...dist.slice(1));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <section className="app-panel app-panel-pad">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">ratings</p>
              <p className="mt-1 text-3xl font-black">
                {ratings ? average.toFixed(1) : "—"} <span className="text-base text-sc-text-dim">/ 5</span>
              </p>
            </div>
            <p className="text-sm font-bold text-sc-text-dim">
              {ratings.toLocaleString()} rating{ratings === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <Stars n={n} size="h-3.5 w-3.5" />
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sc-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${((dist[n] ?? 0) / peak) * 100}%`, background: "#F5A524" }} />
                </div>
                <span className="w-10 text-right text-sm font-black tabular-nums">{dist[n] ?? 0}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="app-panel app-panel-pad">
            <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">went on to google</p>
            <p className="mt-1 text-3xl font-black">{googleClicks.toLocaleString()}</p>
            <p className="text-xs font-semibold text-sc-text-dimmer">customers sent to your Google review page</p>
          </div>
          <div className="app-panel app-panel-pad">
            <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">written feedback</p>
            <p className="mt-1 text-3xl font-black">{items.length.toLocaleString()}</p>
            <p className="text-xs font-semibold text-sc-text-dimmer">{capped ? "showing the latest 200" : "messages from customers"}</p>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-sc-text-dimmer">feedback</h2>
        {items.length === 0 ? (
          <div className="app-panel app-panel-pad flex flex-col items-center gap-2 py-10 text-center">
            <MessageSquare className="h-5 w-5 text-sc-text-dimmer" />
            <p className="text-sm font-bold">No written feedback yet.</p>
          </div>
        ) : (
          items.map((f) => (
            <article key={f.id} className="app-panel app-panel-pad space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars n={f.rating} />
                <time className="text-xs font-semibold text-sc-text-dimmer" dateTime={f.created_at}>
                  {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </div>
              {f.message && <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed">&ldquo;{f.message}&rdquo;</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-sc-text-dim">
                {f.category && <span>Topic: {f.category}</span>}
                {f.card && (
                  <span>
                    Card: {formatSerial(f.card.serial)}
                    {f.card.nickname ? ` · ${f.card.nickname}` : ""}
                    {f.card.location ? ` · ${f.card.location}` : ""}
                  </span>
                )}
                {f.business && <span>{f.business}</span>}
              </div>
              {(f.contact_name || f.contact_phone || f.contact_email) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-sc-border-soft pt-2 text-xs font-bold">
                  {f.contact_name && <span>{f.contact_name}</span>}
                  {f.contact_phone && (
                    <a href={`tel:${f.contact_phone}`} className="text-sc-gold-text hover:underline">
                      {f.contact_phone}
                    </a>
                  )}
                  {f.contact_email && (
                    <a href={`mailto:${f.contact_email}`} className="text-sc-gold-text hover:underline">
                      {f.contact_email}
                    </a>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
