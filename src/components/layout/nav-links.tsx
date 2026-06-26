"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Boxes,
  Tags,
  PackageSearch,
  ClipboardList,
  Calculator,
  BarChart3,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  roles?: readonly UserRole[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Procurement",
    items: [
      { href: "/purchase-requests", label: "Purchase Requests", icon: FileText },
      { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/inventory", label: "Items", icon: Boxes, exact: true },
      { href: "/inventory/categories", label: "Categories", icon: Tags, roles: ["manager", "admin"] },
      { href: "/stock-requests", label: "Stock Requests", icon: PackageSearch },
      { href: "/claims", label: "Claims", icon: ClipboardList },
    ],
  },
  {
    label: "Accounting",
    items: [
      { href: "/accounting", label: "Accounting", icon: Calculator, roles: ["manager", "finance", "admin"] },
      { href: "/reports", label: "Reports", icon: BarChart3, roles: ["manager", "finance", "admin"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin", label: "Admin", icon: Settings, roles: ["admin"] },
    ],
  },
];

/** Shared navigation links used by both the desktop sidebar and the mobile drawer. */
export function NavLinks({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || item.roles.includes(role),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-1 flex-col gap-4 p-2">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
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
          </div>
        </div>
      ))}
    </nav>
  );
}
