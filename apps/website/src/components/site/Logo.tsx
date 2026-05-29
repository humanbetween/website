import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        aria-hidden
        className="inline-block h-6 w-6 rounded-full bg-foreground"
      />
      <span className="tracking-tight">human between</span>
    </Link>
  );
}
