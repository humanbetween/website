"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  ShoppingBag,
  Users,
  LineChart,
  Settings,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/site/Logo";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/prompts",
    label: "Prompts",
    icon: Sparkles,
    match: (p) => p.startsWith("/admin/prompts"),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingBag,
    match: (p) => p.startsWith("/admin/orders"),
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
    match: (p) => p.startsWith("/admin/customers"),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: LineChart,
    match: (p) => p.startsWith("/admin/analytics"),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/admin/settings"),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r border-border/40 bg-card/30 flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-5 border-b border-border/40">
        <Logo variant="full" />
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "inline-flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors " +
                (active
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border/40">
        <button
          type="button"
          onClick={onSignOut}
          className="w-full inline-flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
