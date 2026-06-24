"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Boxes,
  PackageSearch,
  Calculator,
  BarChart3,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/roles";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/purchase-requests", label: "Purchase Requests", icon: FileText },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/stock-requests", label: "Stock Requests", icon: PackageSearch },
  { href: "/accounting", label: "Accounting", icon: Calculator, roles: ["manager", "finance", "admin"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["manager", "finance", "admin"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin"] },
] as const;

/** Shared navigation links used by both the desktop sidebar and the mobile drawer. */
export function NavLinks({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV.filter(
    (item) => !("roles" in item) || (item.roles as readonly UserRole[]).includes(role),
  );

  return (
    <nav className="flex flex-1 flex-col gap-1 p-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
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
