export default function MatchesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-3 w-20 rounded bg-card-hover/60" />
      <div className="mt-2 h-9 w-52 rounded-lg bg-card-hover/70" />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-28" />
        ))}
      </div>
    </div>
  );
}
