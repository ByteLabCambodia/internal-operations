import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InventoryPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const canManage = profile && can(profile.role as UserRole, "inventory.manage");

  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, sku, name, category, unit, stock_qty, reorder_point, active")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Catalog and stock levels.</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/inventory/new"><Plus className="size-4" /> New item</Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Reorder pt</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items ?? []).map((it) => {
              const low = Number(it.stock_qty) <= Number(it.reorder_point);
              return (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs">{it.sku}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell className="text-muted-foreground">{it.category ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={low ? "font-medium text-destructive" : ""}>
                      {Number(it.stock_qty)} {it.unit}
                    </span>
                    {low && <AlertTriangle className="ml-1 inline size-3.5 text-destructive" />}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(it.reorder_point)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/inventory/${it.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {(items ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No inventory items yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

}
