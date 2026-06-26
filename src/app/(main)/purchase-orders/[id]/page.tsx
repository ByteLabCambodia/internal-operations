import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { format as formatMoney, formatUsd, type Currency } from "@/lib/money";
import { presignDownload } from "@/lib/r2";
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
import { RecordPaymentForm } from "@/features/procurement/components/record-payment-form";
import { ReceiptThumbnail } from "@/features/procurement/components/receipt-thumbnail";
import { PAYMENT_METHOD_LABELS } from "@/features/procurement/schemas";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, po_number, created_at, type, supplier, status, payment_status, currency, exchange_rate, total_original, total_usd")
    .eq("id", id)
    .maybeSingle();
  if (!po) notFound();

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase
      .from("purchase_order_items")
      .select("id, name, qty_ordered, qty_claimed, unit_price_original")
      .eq("po_id", id),
    supabase
      .from("payments")
      .select("id, amount_original, currency, amount_usd, method, bank_account, reference, paid_at, receipt_object_key, journal_entry_id")
      .eq("po_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  // Presign a short-lived GET URL for each stored receipt so it can be viewed
  // without making the bucket public. Generated fresh on every page load.
  const receiptUrls = new Map<string, string>();
  await Promise.all(
    (payments ?? [])
      .filter((p) => p.receipt_object_key)
      .map(async (p) => {
        receiptUrls.set(p.id, await presignDownload(p.receipt_object_key as string));
      }),
  );

  const currency = po.currency as Currency;
  const canPay = profile && can(profile.role as UserRole, "payment.record") && po.payment_status !== "paid";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/purchase-orders"><ArrowLeft className="size-4" /> Back</Link>
        </Button>
        <div className="flex gap-2">
          <StatusBadge status={po.status} />
          <StatusBadge status={po.payment_status} />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {po.po_number} {po.supplier ? `· ${po.supplier}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">
          {po.type} · Created {new Date(po.created_at).toLocaleString()} · Locked rate{" "}
          {Number(po.exchange_rate)} {currency}/USD
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Claimed</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items ?? []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(it.qty_ordered)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(it.qty_claimed)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(it.unit_price_original), currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end gap-6 text-sm">
            <div className="text-right">
              <div className="text-muted-foreground">Total ({currency})</div>
              <div className="text-lg font-semibold tabular-nums">{formatMoney(Number(po.total_original), currency)}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground">USD</div>
              <div className="text-lg font-semibold tabular-nums">{formatUsd(Number(po.total_usd))}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {(payments ?? []).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">USD</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Bank / Ref</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Journal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments!.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.paid_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(Number(p.amount_original), p.currency as Currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(Number(p.amount_usd))}</TableCell>
                    <TableCell>{p.method ? PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS] : "—"}</TableCell>
                    <TableCell>
                      {p.bank_account || p.reference ? (
                        <div className="text-xs">
                          {p.bank_account && <div>{p.bank_account}</div>}
                          {p.reference && (
                            <div className="text-muted-foreground">{p.reference}</div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {receiptUrls.has(p.id) ? (
                        <ReceiptThumbnail
                          url={receiptUrls.get(p.id) as string}
                          objectKey={p.receipt_object_key as string}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{p.journal_entry_id ? "Posted" : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          )}

          {canPay && (
            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-medium">Record a payment</p>
              <RecordPaymentForm poId={po.id} defaultCurrency={currency} />
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityTimeline entityType="purchase_order" entityId={po.id} />
    </div>
  );
}
