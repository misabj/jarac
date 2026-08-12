export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-4 w-16 rounded bg-card-hover/70" />
      <div className="mt-3 h-9 w-56 rounded-lg bg-card-hover/70" />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-8 w-20 rounded bg-card-hover/70" />
            <div className="mt-3 h-4 w-32 rounded bg-card-hover/60" />
            <div className="mt-4 h-4 w-40 rounded bg-card-hover/50" />
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-14" />
        ))}
      </div>
    </div>
  );
}
