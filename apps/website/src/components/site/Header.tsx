"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap } from "lucide-react";
import { Logo } from "./Logo";

const SKOOL_URL = process.env.NEXT_PUBLIC_SKOOL_URL ?? "#";

export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Logo />

        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Library
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass text-xs font-medium hover:bg-card/80 transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Skool
          </a>
          <Link
            href="/auth/sign-in"
            className="hidden sm:inline-flex px-4 py-2 rounded-full glass text-sm font-medium hover:bg-card/80 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/pricing"
            className="hidden sm:inline-flex px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Go unlimited
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-full glass"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
          <nav className="container mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1 text-sm">
            <Link href="/" onClick={close} className="px-3 py-3 rounded-lg hover:bg-foreground/5">
              Library
            </Link>
            <Link href="/pricing" onClick={close} className="px-3 py-3 rounded-lg hover:bg-foreground/5">
              Pricing
            </Link>
            <a
              href={SKOOL_URL}
              target="_blank"
              rel="noreferrer"
              onClick={close}
              className="px-3 py-3 rounded-lg hover:bg-foreground/5 inline-flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4" /> Skool
            </a>
            <Link
              href="/auth/sign-in"
              onClick={close}
              className="px-3 py-3 rounded-lg hover:bg-foreground/5"
            >
              Sign in
            </Link>
            <Link
              href="/pricing"
              onClick={close}
              className="mt-2 px-4 py-3 rounded-full bg-foreground text-background text-sm font-medium text-center"
            >
              Go unlimited
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
