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
import { StockRequestForm } from "@/features/stock/components/stock-request-form";
import { StockDecideButtons } from "@/features/stock/components/decide-buttons";

export default async function StockRequestsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const canFulfil = profile && can(profile.role as UserRole, "stock.fulfil");

  const [{ data: requests }, { data: items }] = await Promise.all([
    supabase
      .from("stock_requests")
      .select("id, qty, status, note, created_at, inventory_items(name, sku, stock_qty)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("inventory_items").select("id, name, sku").eq("active", true).order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock Requests</h1>
        <p className="text-sm text-muted-foreground">
          Request items from stock. Fulfilment decreases stock and may auto-create a reorder PR.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Request stock</CardTitle></CardHeader>
        <CardContent>
          <StockRequestForm items={items ?? []} />
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
              {canFulfil && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(requests ?? []).map((r) => {
              const inv = r.inventory_items as unknown as { name: string; sku: string; stock_qty: number } | null;
              return (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {inv ? `${inv.sku} · ${inv.name}` : "—"}
                    {inv && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (in stock {Number(inv.stock_qty)})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(r.qty)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  {canFulfil && (
                    <TableCell className="text-right">
                      {r.status === "pending" ? <StockDecideButtons requestId={r.id} /> : null}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {(requests ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={canFulfil ? 5 : 4} className="py-10 text-center text-sm text-muted-foreground">
                  No stock requests yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
