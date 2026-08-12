export default function StandingsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-3 w-20 rounded bg-card-hover/60" />
      <div className="mt-2 h-9 w-48 rounded-lg bg-card-hover/70" />

      <div className="mt-6 card overflow-hidden">
        <div className="h-12 bg-card-hover/50" />
        <div className="divide-y divide-border/60">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}
