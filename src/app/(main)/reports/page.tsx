import Link from "next/link";
import { Download } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as reports from "@/features/accounting/services/reports";

const REPORTS = [
  { key: "pnl", label: "P&L", fn: reports.profitAndLoss },
  { key: "cash-flow", label: "Cash Flow", fn: reports.cashFlow },
  { key: "expense-category", label: "Expense by Category", fn: reports.expenseByCategory },
  { key: "expense-department", label: "Expense by Department", fn: reports.expenseByDepartment },
  { key: "budget-vs-actual", label: "Budget vs Actual", fn: reports.budgetVsActual },
  { key: "currency-summary", label: "Currency Summary", fn: reports.currencySummary },
  { key: "po-summary", label: "PO Summary", fn: reports.poSummary },
  { key: "transactions", label: "Transactions", fn: reports.transactionHistory },
] as const;

const MONEY_HINT = /usd|amount|budget|actual|variance|income|expense|net|inflow|outflow|original/i;

function fmtCell(key: string, value: unknown) {
  if (typeof value === "number") {
    return MONEY_HINT.test(key)
      ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;
  }
  if (typeof value === "string" && value.length > 20 && /^[0-9a-f-]{36}$/.test(value)) {
    return value.slice(0, 8);
  }
  return String(value ?? "—");
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; from?: string; to?: string }>;
}) {
  await requirePermission("accounting.view");
  const { report = "pnl", from, to } = await searchParams;
  const supabase = await createClient();

  const active = REPORTS.find((r) => r.key === report) ?? REPORTS[0];
  const rows = (await active.fn(supabase, { from, to })) as Record<string, unknown>[];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const qs = new URLSearchParams({ type: active.key, ...(from ? { from } : {}), ...(to ? { to } : {}) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          All figures in USD using each record&apos;s locked exchange rate.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => {
          const params = new URLSearchParams({ report: r.key, ...(from ? { from } : {}), ...(to ? { to } : {}) });
          return (
            <Button key={r.key} asChild size="sm" variant={r.key === active.key ? "default" : "outline"}>
              <Link href={`/reports?${params.toString()}`}>{r.label}</Link>
            </Button>
          );
        })}
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <Input type="hidden" name="report" value={active.key} />
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <Button type="submit" variant="secondary">Apply</Button>
        <Button asChild variant="outline">
          <a href={`/api/reports?${qs.toString()}`}><Download className="size-4" /> Export CSV</a>
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c} className={MONEY_HINT.test(c) ? "text-right" : ""}>
                  {c.replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c} className={MONEY_HINT.test(c) ? "text-right tabular-nums" : ""}>
                    {fmtCell(c, row[c])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground">
                  No data for this range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
