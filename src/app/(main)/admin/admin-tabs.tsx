"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Building2, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/organization", label: "Organization", icon: Building2 },
  { href: "/admin/settings", label: "Settings", icon: SlidersHorizontal },
] as const;

/** Secondary navigation for the admin section. */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors -mb-px",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
