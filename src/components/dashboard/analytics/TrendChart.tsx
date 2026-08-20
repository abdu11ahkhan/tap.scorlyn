import type { AnalyticsSummary } from "@/lib/analytics";

/**
 * One restrained chart, not one per metric: views as the base bar, other
 * interactions stacked on top in a lighter gold — the two numbers this
 * page actually wants you to compare, in one shape instead of two charts
 * side by side.
 */
export default function TrendChart({ series }: { series: AnalyticsSummary["dailySeries"] }) {
  const peak = Math.max(1, ...series.map((d) => d.views + d.interactions));
  const showEveryNth = series.length > 45 ? 7 : series.length > 20 ? 3 : 1;

  return (
    <div>
      <div className="flex h-40 gap-[3px]">
        {series.map((day) => {
          const total = day.views + day.interactions;
          const viewsPct = (day.views / peak) * 100;
          const interactionsPct = (day.interactions / peak) * 100;
          return (
            <div key={day.date} className="group flex flex-1 flex-col items-stretch">
              {/* flex-col-reverse + percentage heights, the "grows from the
                  bottom" technique — needs a definite parent height to
                  resolve against, which is why the outer row must NOT use
                  items-end (that leaves each column's height indeterminate,
                  and the percentage heights below silently collapse to
                  nothing despite computing the correct number). */}
              <div className="flex w-full flex-1 flex-col-reverse items-stretch">
                <div
                  className="min-h-[2px] w-full rounded-t-sm bg-sc-gold transition-colors group-hover:bg-sc-gold-hover"
                  style={{ height: `${viewsPct}%` }}
                  title={`${day.date} — ${day.views} view${day.views === 1 ? "" : "s"}`}
                />
                {day.interactions > 0 && (
                  <div
                    className="w-full rounded-t-sm bg-sc-text-dimmer/70 transition-colors group-hover:bg-sc-text-dim"
                    style={{ height: `${interactionsPct}%` }}
                    title={`${day.date} — ${day.interactions} interaction${day.interactions === 1 ? "" : "s"}`}
                  />
                )}
              </div>
              {total === 0 && <div className="h-[2px] w-full rounded-t-sm bg-sc-border" />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-semibold tabular-nums text-sc-text-dimmer">
        {series
          .filter((_, i) => i % showEveryNth === 0 || i === series.length - 1)
          .map((day) => (
            <span key={day.date}>
              {new Date(day.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-sc-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-sc-gold" /> Views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-sc-text-dimmer/70" /> Other interactions
        </span>
      </div>
    </div>
  );
}
