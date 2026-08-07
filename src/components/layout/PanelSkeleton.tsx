/**
 * Placeholder shown while a route's server render is in flight.
 *
 * Without a loading boundary the browser stays on the previous page with no
 * feedback until the new one is fully rendered, which reads as the app being
 * frozen. This costs nothing and makes the navigation feel immediate.
 */
export default function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4 p-6 md:p-10">
      <div className="h-7 w-44 rounded-lg bg-white/[0.07]" />
      <div className="h-4 w-72 max-w-full rounded bg-white/[0.05]" />
      <div className="space-y-3 pt-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
