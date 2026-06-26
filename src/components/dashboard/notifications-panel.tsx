import Link from "next/link";
import { AlertTriangle, Bell, Inbox } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type LowStockItem = { id: string; sku: string; name: string; stock_qty: number; reorder_point: number };

export function NotificationsPanel({
  lowStock,
  pendingApprovals,
}: {
  lowStock: LowStockItem[];
  pendingApprovals: number;
}) {
  const empty = lowStock.length === 0 && pendingApprovals === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4" /> Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {empty && (
          <p className="flex items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <Inbox className="size-4" /> You&apos;re all caught up.
          </p>
        )}

        {pendingApprovals > 0 && (
          <Link
            href="/purchase-requests?status=pending"
            className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:hover:bg-blue-950/60"
          >
            <Bell className="size-4 shrink-0 text-blue-600" />
            <span>
              <span className="font-medium">{pendingApprovals}</span> request
              {pendingApprovals === 1 ? "" : "s"} awaiting your approval
            </span>
          </Link>
        )}

        {lowStock.map((i) => (
          <Link
            key={i.id}
            href={`/inventory/${i.id}`}
            className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950/60"
          >
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span className="flex-1 truncate">
              <span className="font-mono text-xs text-muted-foreground">{i.sku}</span> · {i.name} is low
            </span>
            <span className="shrink-0 tabular-nums text-amber-700 dark:text-amber-400">
              {Number(i.stock_qty)} / {Number(i.reorder_point)}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
