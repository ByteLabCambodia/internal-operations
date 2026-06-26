import Link from "next/link";
import { Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { formatUsd } from "@/lib/money";
import { profitAndLoss, expenseByCategory, expenseByDepartment } from "@/features/accounting/services/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/features/accounting/components/dashboard-charts";
import { ActivityFeed, type ActivityEvent } from "@/components/dashboard/activity-feed";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";

const short = (id: string) => id.slice(0, 8);

export default async function DashboardPage() {
  const profile = await requireUser();
  const role = profile.role as UserRole;
  const supabase = await createClient();

  const seesFinance = can(role, "accounting.view");
  const decidesPrs = can(role, "pr.decide");

  // KPIs + low stock + activity source rows.
  const [myPending, openPos, items, pendingPrs, recentPrs, recentPos, recentPayments, recentClaims, recentStock] =
    await Promise.all([
      supabase
        .from("purchase_requests")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", profile.id)
        .eq("status", "pending"),
      supabase.from("purchase_orders").select("id", { count: "exact", head: true }).in("status", ["open", "partial"]),
      supabase.from("inventory_items").select("id, sku, name, stock_qty, reorder_point").eq("active", true),
      supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("purchase_requests")
        .select("id, status, created_at, decided_at, requester_id, approver_id")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase.from("purchase_orders").select("id, po_number, created_at, created_by, supplier").order("created_at", { ascending: false }).limit(10),
      supabase.from("payments").select("id, paid_at, po_id, recorded_by, purchase_orders(po_number)").order("paid_at", { ascending: false }).limit(10),
      supabase.from("inventory_claims").select("id, status, created_at, confirmed_at, confirmed_by").order("created_at", { ascending: false }).limit(10),
      supabase.from("stock_requests").select("id, status, created_at, fulfilled_at, fulfilled_by").order("created_at", { ascending: false }).limit(10),
    ]);

  const lowStock = (items.data ?? []).filter((i) => Number(i.stock_qty) <= Number(i.reorder_point));

  // Resolve actor names in one lookup.
  const ids = new Set<string>();
  for (const r of recentPrs.data ?? []) {
    if (r.requester_id) ids.add(r.requester_id);
    if (r.approver_id) ids.add(r.approver_id);
  }
  for (const r of recentPos.data ?? []) if (r.created_by) ids.add(r.created_by);
  for (const r of recentPayments.data ?? []) if (r.recorded_by) ids.add(r.recorded_by);
  for (const r of recentClaims.data ?? []) if (r.confirmed_by) ids.add(r.confirmed_by);
  for (const r of recentStock.data ?? []) if (r.fulfilled_by) ids.add(r.fulfilled_by);
  const { data: people } = ids.size
    ? await supabase.from("profiles").select("id, full_name").in("id", [...ids])
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name ?? "Someone"]));

  // Build the activity feed.
  const events: ActivityEvent[] = [];
  for (const r of recentPrs.data ?? []) {
    events.push({
      id: `pr-new-${r.id}`,
      type: "pr_submitted",
      message: `${nameOf.get(r.requester_id) ?? "Someone"} submitted PR-${short(r.id)}`,
      href: `/purchase-requests/${r.id}`,
      at: r.created_at,
    });
    if ((r.status === "approved" || r.status === "rejected") && r.decided_at) {
      events.push({
        id: `pr-dec-${r.id}`,
        type: r.status === "approved" ? "pr_approved" : "pr_rejected",
        message: `${nameOf.get(r.approver_id ?? "") ?? "A manager"} ${r.status} PR-${short(r.id)}`,
        href: `/purchase-requests/${r.id}`,
        at: r.decided_at,
      });
    }
  }
  for (const r of recentPos.data ?? []) {
    events.push({
      id: `po-${r.id}`,
      type: "po_created",
      message: `${nameOf.get(r.created_by ?? "") ?? "A manager"} created ${r.po_number}${r.supplier ? ` (${r.supplier})` : ""}`,
      href: `/purchase-orders/${r.id}`,
      at: r.created_at,
    });
  }
  for (const r of recentPayments.data ?? []) {
    events.push({
      id: `pay-${r.id}`,
      type: "payment_recorded",
      message: `${nameOf.get(r.recorded_by ?? "") ?? "Finance"} recorded a payment${r.po_id ? ` for ${(r.purchase_orders as { po_number: string } | null)?.po_number ?? r.po_id}` : ""}`,
      href: r.po_id ? `/purchase-orders/${r.po_id}` : "/purchase-orders",
      at: r.paid_at,
    });
  }
  for (const r of recentClaims.data ?? []) {
    if (r.status === "confirmed" && r.confirmed_at) {
      events.push({
        id: `clm-${r.id}`,
        type: "claim_confirmed",
        message: `${nameOf.get(r.confirmed_by ?? "") ?? "A manager"} confirmed claim CLM-${short(r.id)}`,
        href: "/claims",
        at: r.confirmed_at,
      });
    }
  }
  for (const r of recentStock.data ?? []) {
    if (r.status === "fulfilled" && r.fulfilled_at) {
      events.push({
        id: `sr-${r.id}`,
        type: "stock_fulfilled",
        message: `${nameOf.get(r.fulfilled_by ?? "") ?? "A manager"} fulfilled SR-${short(r.id)}`,
        href: "/stock-requests",
        at: r.fulfilled_at,
      });
    }
  }
  events.sort((a, b) => b.at.localeCompare(a.at));
  const feed = events.slice(0, 10);

  // Financial KPIs + chart data (only for roles that can view accounting).
  const now = new Date();
  const currentYm = now.toISOString().slice(0, 7);
  const from6 = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);

  let monthlyExpense = 0;
  let cashBalance = 0;
  let chartMonths: { month: string; income: number; expense: number }[] = [];
  let byCategory: { category: string; amount_usd: number }[] = [];
  let byDepartment: { department: string; amount_usd: number }[] = [];

  if (seesFinance) {
    const [pnlAll, cats, depts] = await Promise.all([
      profitAndLoss(supabase, {}),
      expenseByCategory(supabase, { from: from6 }),
      expenseByDepartment(supabase, { from: from6 }),
    ]);
    cashBalance = pnlAll.reduce((s, r) => s + r.net, 0);
    monthlyExpense = pnlAll.find((r) => r.month === currentYm)?.expense ?? 0;
    chartMonths = pnlAll.slice(-6).map((r) => ({ month: r.month, income: r.income, expense: r.expense }));
    byCategory = cats;
    byDepartment = depts;
  }

  const cards = [
    { title: "My pending requests", value: String(myPending.count ?? 0), note: "Awaiting a decision", href: "/purchase-requests?status=pending" },
    { title: "Low-stock items", value: String(lowStock.length), note: "At or below reorder point", href: "/inventory" },
    { title: "Open purchase orders", value: String(openPos.count ?? 0), note: "Awaiting fulfilment or payment", href: "/purchase-orders" },
    ...(seesFinance
      ? [
          { title: "This month's expense", value: formatUsd(monthlyExpense), note: "Recorded payments this month", href: "/reports" },
          { title: "Cash balance", value: formatUsd(cashBalance), note: "Income minus expense, all time", href: "/reports" },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {profile.full_name ?? "there"}.</p>
        </div>
        <Button asChild>
          <Link href="/purchase-requests/new">
            <Plus className="size-4" /> Quick PR
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.title} href={c.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader className="pb-2">
                <CardDescription>{c.title}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{c.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{c.note}</CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {seesFinance && (
        <DashboardCharts byMonth={chartMonths} byCategory={byCategory} byDepartment={byDepartment} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed events={feed} />
        <NotificationsPanel lowStock={lowStock} pendingApprovals={decidesPrs ? pendingPrs.count ?? 0 : 0} />
      </div>
    </div>
  );
}
