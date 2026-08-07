/**
 * Shown while the gallery renders on the server.
 *
 * Without it the browser stayed on the previous page with no feedback, which
 * is why the anchor links to #features and #pricing felt instant while
 * /templates felt slow — those never leave the page, this one does.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-ink px-6 py-28">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-14 w-72 max-w-full rounded-2xl bg-white/[0.07]" />
        <div className="mt-4 h-5 w-96 max-w-full rounded bg-white/[0.05]" />
        <div className="mt-10 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-28 rounded-full bg-white/[0.05]" />
          ))}
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-72 rounded-[1.75rem] bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  );
}
