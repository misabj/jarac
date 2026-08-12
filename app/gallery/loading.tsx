export default function GalleryLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-3 w-20 rounded bg-card-hover/60" />
      <div className="mt-2 h-9 w-48 rounded-lg bg-card-hover/70" />
      <div className="mt-2 h-4 w-64 rounded bg-card-hover/50" />

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card aspect-square" />
        ))}
      </div>
    </div>
  );
}
