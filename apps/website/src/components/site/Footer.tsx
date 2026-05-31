import Link from "next/link";
import { getSocialLinks } from "@/lib/site-settings";
import { SocialIcons } from "./SocialIcons";

export async function Footer() {
  const social = await getSocialLinks();

  return (
    <footer className="mt-20 border-t border-border/50">
      <div className="container mx-auto max-w-7xl px-6 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Human Between. All rights reserved.</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/account" className="hover:text-foreground transition-colors">
              Account
            </Link>
          </nav>
          <SocialIcons links={social} />
        </div>
      </div>
    </footer>
  );
}
