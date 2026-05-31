export default function Loading() {
  return (
    <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 pt-20 pb-20">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-card/40 border border-border/40 animate-pulse"
            style={{ height: 200 + ((i * 37) % 180) }}
          />
        ))}
      </div>
    </div>
  );
}
