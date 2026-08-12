export default function PlayerDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-4 w-20 rounded bg-card-hover/60" />
      <div className="mt-4 flex items-center gap-4">
        <div className="h-28 w-28 sm:h-[140px] sm:w-[140px] rounded-2xl bg-card-hover/70" />
        <div className="space-y-3">
          <div className="h-8 w-48 rounded-lg bg-card-hover/70" />
          <div className="h-4 w-32 rounded bg-card-hover/50" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
      <div className="mt-6 card h-64" />
    </div>
  );
}
