import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const [myPending, openPos, items] = await Promise.all([
    supabase
      .from("purchase_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", profile.id)
      .eq("status", "pending"),
    supabase.from("purchase_orders").select("id", { count: "exact", head: true }).in("status", ["open", "partial"]),
    supabase.from("inventory_items").select("id, sku, name, stock_qty, reorder_point").eq("active", true),
  ]);

  const lowStock = (items.data ?? []).filter((i) => Number(i.stock_qty) <= Number(i.reorder_point));

  const cards = [
    { title: "My pending requests", value: myPending.count ?? 0, note: "Awaiting a decision", href: "/purchase-requests?status=pending" },
    { title: "Low-stock items", value: lowStock.length, note: "At or below reorder point", href: "/inventory" },
    { title: "Open purchase orders", value: openPos.count ?? 0, note: "Awaiting fulfilment or payment", href: "/purchase-orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {profile.full_name ?? "there"}.</p>
        </div>
        <Button asChild>
          <Link href="/purchase-requests/new"><Plus className="size-4" /> Quick PR</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.title} href={c.href}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader className="pb-2">
                <CardDescription>{c.title}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{c.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{c.note}</CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" /> Low-stock alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.map((i) => (
              <Link
                key={i.id}
                href={`/inventory/${i.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/40"
              >
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{i.sku}</span> · {i.name}
                </span>
                <span className="tabular-nums text-destructive">
                  {Number(i.stock_qty)} / {Number(i.reorder_point)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
