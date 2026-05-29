import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/50">
      <div className="container mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Human Between. All rights reserved.</p>
        <nav className="flex items-center gap-6">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/account" className="hover:text-foreground transition-colors">
            Account
          </Link>
          <a
            href="mailto:hello@humanbetween.ai"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
