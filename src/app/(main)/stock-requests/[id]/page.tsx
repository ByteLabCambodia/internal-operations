import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockDecideButtons } from "@/features/stock/components/decide-buttons";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";

export default async function StockRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: req } = await supabase
    .from("stock_requests")
    .select(
      "id, qty, priority, department, status, note, created_at, inventory_items(name, sku, stock_qty)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!req) notFound();

  const inv = req.inventory_items as unknown as {
    name: string;
    sku: string;
    stock_qty: number;
  } | null;
  const role = profile?.role as UserRole | undefined;
  const canFulfil =
    role && can(role, "stock.fulfil") && (req.status === "pending" || req.status === "approved");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/stock-requests">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <StatusBadge status={req.status} />
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock Request</h1>
        <p className="text-sm text-muted-foreground">
          Created {new Date(req.created_at).toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item</span>
            <span>{inv ? `${inv.sku} · ${inv.name}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <span className="tabular-nums">{Number(req.qty)}</span>
          </div>
          {inv && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">In stock</span>
              <span className="tabular-nums">{Number(inv.stock_qty)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Priority</span>
            <span className="capitalize">{req.priority}</span>
          </div>
          {req.department && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span>{req.department}</span>
            </div>
          )}
          {req.note && (
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Note</span>
              <span className="text-right">{req.note}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {canFulfil && (
        <div className="flex justify-end">
          <StockDecideButtons requestId={req.id} status={req.status} />
        </div>
      )}

      <ActivityTimeline entityType="stock_request" entityId={req.id} />
    </div>
  );
}
