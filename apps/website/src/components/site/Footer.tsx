import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/50">
      <div className="container mx-auto max-w-7xl px-6 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Human Between. All rights reserved.</p>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/account" className="hover:text-foreground transition-colors">
            Account
          </Link>
          <a
            href="mailto:hello@humanbetween.com"
            className="hover:text-foreground transition-colors"
          >
            Support: hello@humanbetween.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
