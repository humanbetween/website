import Link from "next/link";
import { Lock } from "lucide-react";

export function UnlockButton() {
  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90"
    >
      <Lock className="h-3 w-3" /> Go unlimited
    </Link>
  );
}
