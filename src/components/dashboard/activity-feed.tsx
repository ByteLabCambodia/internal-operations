import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  CreditCard,
  Package,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ActivityType =
  | "pr_submitted"
  | "pr_approved"
  | "pr_rejected"
  | "po_created"
  | "payment_recorded"
  | "claim_confirmed"
  | "stock_fulfilled";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  message: string;
  href: string;
  at: string;
};

const ICON: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  pr_submitted: { icon: ClipboardList, className: "text-blue-600" },
  pr_approved: { icon: CheckCircle2, className: "text-emerald-600" },
  pr_rejected: { icon: XCircle, className: "text-red-600" },
  po_created: { icon: ShoppingCart, className: "text-blue-600" },
  payment_recorded: { icon: CreditCard, className: "text-emerald-600" },
  claim_confirmed: { icon: Package, className: "text-emerald-600" },
  stock_fulfilled: { icon: Warehouse, className: "text-emerald-600" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {events.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
        )}
        {events.map((e) => {
          const { icon: Icon, className } = ICON[e.type];
          return (
            <Link
              key={e.id}
              href={e.href}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/40"
            >
              <Icon className={`size-4 shrink-0 ${className}`} />
              <span className="flex-1 truncate">{e.message}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(e.at)}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
