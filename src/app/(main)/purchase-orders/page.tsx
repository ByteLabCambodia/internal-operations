import Link from "next/link";
import { Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { format as formatMoney, formatUsd, type Currency } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PurchaseOrdersPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const canCreate = profile && can(profile.role as UserRole, "po.create");

  const { data: pos } = await supabase
    .from("purchase_orders")
    .select("id, created_at, type, supplier, status, payment_status, currency, total_original, total_usd")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Orders, fulfilment, and payments.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/purchase-orders/new">
              <Plus className="size-4" /> New PO
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">USD</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(pos ?? []).map((po) => (
              <TableRow key={po.id}>
                <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{po.supplier ?? "—"}</TableCell>
                <TableCell className="capitalize">{po.type}</TableCell>
                <TableCell><StatusBadge status={po.status} /></TableCell>
                <TableCell><StatusBadge status={po.payment_status} /></TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(Number(po.total_original), po.currency as Currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(Number(po.total_usd))}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/purchase-orders/${po.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(pos ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No purchase orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
