export default function Loading() {
  return (
    <div className="min-h-screen bg-paper px-6 py-28">
      <div className="mx-auto max-w-4xl animate-pulse space-y-4">
        <div className="h-12 w-64 max-w-full rounded-2xl bg-mist" />
        <div className="h-5 w-80 max-w-full rounded bg-mist" />
        <div className="space-y-3 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-mist" />
          ))}
        </div>
      </div>
    </div>
  );
}
