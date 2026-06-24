import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdjustForm } from "@/features/inventory/components/adjust-form";

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile();
  const canManage = profile && can(profile.role as UserRole, "inventory.manage");

  const { data: item } = await supabase
    .from("inventory_items")
    .select("id, sku, name, category, unit, stock_qty, reorder_point, reorder_qty")
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const { data: movements } = await supabase
    .from("stock_movements")
    .select("id, delta, reason, balance_after, created_at")
    .eq("inventory_item_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const low = Number(item.stock_qty) <= Number(item.reorder_point);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/inventory"><ArrowLeft className="size-4" /> Back</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
        <p className="font-mono text-sm text-muted-foreground">{item.sku}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Stock</CardTitle></CardHeader>
          <CardContent>
            <span className={`text-3xl font-semibold tabular-nums ${low ? "text-destructive" : ""}`}>
              {Number(item.stock_qty)}
            </span>
            <span className="ml-1 text-sm text-muted-foreground">{item.unit}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Reorder point</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{Number(item.reorder_point)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Reorder qty</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">{Number(item.reorder_qty)}</CardContent>
        </Card>
      </div>

      {canManage && (
        <Card>
          <CardHeader><CardTitle>Adjust stock</CardTitle></CardHeader>
          <CardContent><AdjustForm itemId={item.id} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Movements</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Δ</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(movements ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{m.reason.replace("_", " ")}</TableCell>
                  <TableCell className={`text-right tabular-nums ${Number(m.delta) < 0 ? "text-destructive" : "text-green-600"}`}>
                    {Number(m.delta) > 0 ? "+" : ""}{Number(m.delta)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(m.balance_after)}</TableCell>
                </TableRow>
              ))}
              {(movements ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No movements yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
