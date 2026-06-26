import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { format as formatMoney, formatUsd, type Currency } from "@/lib/money";
import { Button } from "@/components/ui/button";
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
import { DecideButtons } from "@/features/procurement/components/decide-buttons";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";

export default async function PurchaseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: pr } = await supabase
    .from("purchase_requests")
    .select(
      "id, pr_number, created_at, status, currency, exchange_rate, total_original, total_usd, note, decided_at, department_id, project_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (!pr) notFound();

  const { data: items } = await supabase
    .from("purchase_request_items")
    .select("id, name, qty, unit_price_original, category")
    .eq("pr_id", id);

  const currency = pr.currency as Currency;
  const role = profile?.role as UserRole | undefined;
  const canDecide = role && can(role, "pr.decide") && pr.status === "pending";
  const canCreatePo = role && can(role, "po.create") && pr.status === "approved";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/purchase-requests">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <StatusBadge status={pr.status} />
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Purchase Request <span className="font-mono text-lg text-muted-foreground">{pr.pr_number}</span></h1>
        <p className="text-sm text-muted-foreground">
          Created {new Date(pr.created_at).toLocaleString()} · Locked rate{" "}
          {Number(pr.exchange_rate)} {currency}/USD
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items ?? []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    {it.name}
                    {it.category && (
                      <span className="ml-2 text-xs text-muted-foreground">{it.category}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(it.qty)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(it.unit_price_original), currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(it.qty) * Number(it.unit_price_original), currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end gap-6 text-sm">
            <div className="text-right">
              <div className="text-muted-foreground">Total ({currency})</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatMoney(Number(pr.total_original), currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground">USD</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatUsd(Number(pr.total_usd))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ActivityTimeline entityType="purchase_request" entityId={pr.id} />

      {pr.note && (
        <Card>
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{pr.note}</CardContent>
        </Card>
      )}

      {canDecide && (
        <div className="flex justify-end">
          <DecideButtons prId={pr.id} />
        </div>
      )}

      {canCreatePo && (
        <div className="flex justify-end">
          <Button asChild>
            <Link href={`/purchase-orders/new?pr=${pr.id}`}>Create Purchase Order</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
