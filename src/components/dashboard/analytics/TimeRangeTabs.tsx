import Link from "next/link";
import { cn } from "@/lib/utils";
import { TIME_RANGES, type TimeRange } from "@/lib/analytics";

const LABELS: Record<TimeRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
};

/**
 * A server-rendered link row rather than client state — the page itself
 * reads ?range= server-side and re-queries, so there's no client-side
 * fetch/loading flicker to manage, and it works with JS disabled.
 */
export default function TimeRangeTabs({ active }: { active: TimeRange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto">
      {TIME_RANGES.map((range) => (
        <Link
          key={range}
          href={range === "30d" ? "/dashboard/analytics" : `/dashboard/analytics?range=${range}`}
          aria-current={active === range ? "true" : undefined}
          className={cn(
            "flex min-h-11 shrink-0 items-center rounded-full border-2 px-4 text-[13px] font-black uppercase tracking-tight transition-colors",
            active === range
              ? "border-sc-gold bg-sc-gold text-sc-gold-ink"
              : "border-sc-border text-sc-text-dim hover:border-sc-gold/50"
          )}
        >
          {LABELS[range]}
        </Link>
      ))}
    </div>
  );
}
