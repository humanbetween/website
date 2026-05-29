import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-md px-6 py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        404
      </p>
      <h1 className="text-3xl font-medium mt-2 mb-4">Nothing here</h1>
      <p className="text-sm text-muted-foreground mb-8">
        That prompt may have been removed, or the URL is off by a letter.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90"
      >
        Back to library
      </Link>
    </div>
  );
}
