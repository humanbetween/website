"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PERKS = [
  "Unlimited prompt copies",
  "Access every premium prompt",
  "Reference images & downloads",
];

export function PaywallModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] p-6 bg-card border-border/60">
        <DialogTitle className="text-xl font-semibold">
          Copy without limits
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mt-1">
          You&apos;ve reached your free copy limit. Create an account or upgrade
          to keep copying.
        </DialogDescription>

        <div className="mt-5 flex flex-col gap-2.5">
          <Link
            href="/pricing"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Go Unlimited <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/sign-up"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-card/60 border border-border/60 text-sm font-medium hover:bg-card/80 transition-colors"
          >
            Create free account
          </Link>
        </div>

        <ul className="mt-5 flex flex-col gap-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              {p}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
