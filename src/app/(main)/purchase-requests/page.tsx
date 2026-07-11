import Link from "next/link";
import { Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatUsd, format as formatMoney, type Currency } from "@/lib/money";
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

const STATUSES = ["all", "draft", "pending", "approved", "rejected", "cancelled"] as const;

export default async function PurchaseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("purchase_requests")
    .select("id, pr_number, created_at, status, currency, total_original, total_usd, auto_generated")
    .order("created_at", { ascending: false });
  if (status !== "all")
    query = query.eq("status", status as Exclude<(typeof STATUSES)[number], "all">);

  const { data: prs } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Requests</h1>
          <p className="text-sm text-muted-foreground">Request items for purchase and approval.</p>
        </div>
        <Button asChild>
          <Link href="/purchase-requests/new">
            <Plus className="size-4" /> New PR
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            asChild
            size="sm"
            variant={s === status ? "default" : "outline"}
            className="capitalize"
          >
            <Link href={s === "all" ? "/purchase-requests" : `/purchase-requests?status=${s}`}>
              {s}
            </Link>
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PR #</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(prs ?? []).map((pr) => (
              <TableRow key={pr.id}>
                <TableCell className="font-mono text-xs">{pr.pr_number}</TableCell>
                <TableCell>
                  {new Date(pr.created_at).toLocaleDateString()}
                  {pr.auto_generated && (
                    <span className="ml-2 text-xs text-muted-foreground">(auto)</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={pr.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <div>{formatMoney(Number(pr.total_original), pr.currency as Currency)}</div>
                  {pr.currency !== "USD" && (
                    <div className="text-xs text-muted-foreground">{formatUsd(Number(pr.total_usd))}</div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/purchase-requests/${pr.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(prs ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No purchase requests yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
