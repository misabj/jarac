export default function MatchDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-4 w-24 rounded bg-card-hover/60" />
      <div className="mt-4 card h-40" />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card h-64" />
        <div className="card h-64" />
      </div>
    </div>
  );
}
