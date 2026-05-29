export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="h-6 w-40 rounded-full bg-card/60 border border-border/40 animate-pulse mb-3" />
        <div className="h-10 w-72 rounded bg-card/40 animate-pulse mb-3" />
        <div className="h-4 w-96 rounded bg-card/30 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/40 p-5 animate-pulse h-32"
          />
        ))}
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/40 h-64 animate-pulse" />
    </div>
  );
}
