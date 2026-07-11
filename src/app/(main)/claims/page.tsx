import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClaimForm } from "@/features/inventory/components/claim-form";
import { ClaimDecideButtons } from "@/features/inventory/components/claim-decide-buttons";

export default async function ClaimsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const canConfirm = profile && can(profile.role as UserRole, "claim.confirm");

  const [{ data: claims }, { data: openPos }, { data: items }] = await Promise.all([
    supabase
      .from("inventory_claims")
      .select("id, qty_claimed, status, created_at, inventory_items(name, sku)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("purchase_orders")
      .select("id, po_number, supplier, status, purchase_order_items(id, name, qty_ordered, qty_claimed)")
      .in("status", ["open", "partial"]),
    supabase.from("inventory_items").select("id, name, sku").eq("active", true).order("name"),
  ]);

  const pos = (openPos ?? []).map((po) => ({
    id: po.id,
    po_number: po.po_number,
    supplier: po.supplier,
    items: ((po.purchase_order_items ?? []) as Array<{ id: string; name: string; qty_ordered: number; qty_claimed: number }>)
      .map((it) => ({
        id: it.id,
        name: it.name,
        remaining: Number(it.qty_ordered) - Number(it.qty_claimed),
      }))
      .filter((it) => it.remaining > 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
        <p className="text-sm text-muted-foreground">
          Claim received goods against a PO. Confirmation increases stock and updates PO fulfilment.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Submit a claim</CardTitle></CardHeader>
        <CardContent>
          <ClaimForm pos={pos} items={items ?? []} />
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Status</TableHead>
              {canConfirm && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(claims ?? []).map((c) => {
              const inv = c.inventory_items as unknown as { name: string; sku: string } | null;
              return (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{inv ? `${inv.sku} · ${inv.name}` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(c.qty_claimed)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  {canConfirm && (
                    <TableCell className="text-right">
                      {c.status === "pending" ? <ClaimDecideButtons claimId={c.id} /> : null}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {(claims ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={canConfirm ? 5 : 4} className="py-10 text-center text-sm text-muted-foreground">
                  No claims yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
