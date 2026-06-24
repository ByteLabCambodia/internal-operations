import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { toCsv } from "@/lib/csv";
import * as reports from "@/features/accounting/services/reports";

/** CSV export for accounting reports. Requires accounting.view. */
export async function GET(request: NextRequest) {
  const profile = await getProfile();
  if (!profile || !can(profile.role as UserRole, "accounting.view")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const range = { from: searchParams.get("from") ?? undefined, to: searchParams.get("to") ?? undefined };
  const supabase = await createClient();

  const builders: Record<string, () => Promise<Record<string, unknown>[]>> = {
    pnl: () => reports.profitAndLoss(supabase, range),
    "cash-flow": () => reports.cashFlow(supabase, range),
    "expense-category": () => reports.expenseByCategory(supabase, range),
    "expense-department": () => reports.expenseByDepartment(supabase, range),
    "currency-summary": () => reports.currencySummary(supabase, range),
    "po-summary": () => reports.poSummary(supabase, range) as Promise<Record<string, unknown>[]>,
    transactions: () => reports.transactionHistory(supabase, range),
    "budget-vs-actual": () => reports.budgetVsActual(supabase, range),
  };

  const build = builders[type];
  if (!build) return NextResponse.json({ error: "unknown report" }, { status: 400 });

  const rows = await build();
  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${type}.csv"`,
    },
  });
}
