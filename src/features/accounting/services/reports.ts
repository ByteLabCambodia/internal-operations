import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Report computations. All figures are USD using the per-record locked rate
 * already stored on journal lines (never today's rate). Datasets for this app
 * are small, so we fetch the relevant rows and aggregate in JS.
 */

export type DateRange = { from?: string; to?: string };
type DB = SupabaseClient<Database>;

type LineRow = {
  debit_usd: number;
  credit_usd: number;
  dimension_department_id: string | null;
  journal_entries: { entry_date: string; currency: string; source: string } | null;
  accounts: { type: string; name: string; code: string } | null;
};

async function fetchLines(supabase: DB, range: DateRange): Promise<LineRow[]> {
  let q = supabase
    .from("journal_lines")
    .select(
      "debit_usd, credit_usd, dimension_department_id, journal_entries!inner(entry_date, currency, source), accounts!inner(type, name, code)",
    );
  if (range.from) q = q.gte("journal_entries.entry_date", range.from);
  if (range.to) q = q.lte("journal_entries.entry_date", range.to);
  const { data } = await q;
  return (data ?? []) as unknown as LineRow[];
}

const month = (d: string) => d.slice(0, 7);

/** P&L: income vs expense by month. */
export async function profitAndLoss(supabase: DB, range: DateRange) {
  const lines = await fetchLines(supabase, range);
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const l of lines) {
    if (!l.journal_entries || !l.accounts) continue;
    const m = month(l.journal_entries.entry_date);
    const row = byMonth.get(m) ?? { income: 0, expense: 0 };
    if (l.accounts.type === "income") row.income += Number(l.credit_usd) - Number(l.debit_usd);
    if (l.accounts.type === "expense") row.expense += Number(l.debit_usd) - Number(l.credit_usd);
    byMonth.set(m, row);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, r]) => ({ month: m, income: r.income, expense: r.expense, net: r.income - r.expense }));
}

/** Cash flow: inflow/outflow through the Cash account by month. */
export async function cashFlow(supabase: DB, range: DateRange) {
  const lines = await fetchLines(supabase, range);
  const byMonth = new Map<string, { inflow: number; outflow: number }>();
  for (const l of lines) {
    if (!l.journal_entries || l.accounts?.code !== "1000") continue;
    const m = month(l.journal_entries.entry_date);
    const row = byMonth.get(m) ?? { inflow: 0, outflow: 0 };
    row.inflow += Number(l.debit_usd);
    row.outflow += Number(l.credit_usd);
    byMonth.set(m, row);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, r]) => ({ month: m, inflow: r.inflow, outflow: r.outflow, net: r.inflow - r.outflow }));
}

/** Expense by category (expense account name). */
export async function expenseByCategory(supabase: DB, range: DateRange) {
  const lines = await fetchLines(supabase, range);
  const map = new Map<string, number>();
  for (const l of lines) {
    if (l.accounts?.type !== "expense") continue;
    const amt = Number(l.debit_usd) - Number(l.credit_usd);
    map.set(l.accounts.name, (map.get(l.accounts.name) ?? 0) + amt);
  }
  return [...map.entries()].map(([category, amount_usd]) => ({ category, amount_usd })).sort((a, b) => b.amount_usd - a.amount_usd);
}

/** Expense by department. */
export async function expenseByDepartment(supabase: DB, range: DateRange) {
  const lines = await fetchLines(supabase, range);
  const { data: depts } = await supabase.from("departments").select("id, name");
  const nameOf = new Map((depts ?? []).map((d) => [d.id, d.name]));
  const map = new Map<string, number>();
  for (const l of lines) {
    if (l.accounts?.type !== "expense") continue;
    const key = l.dimension_department_id ?? "—";
    const amt = Number(l.debit_usd) - Number(l.credit_usd);
    map.set(key, (map.get(key) ?? 0) + amt);
  }
  return [...map.entries()]
    .map(([id, amount_usd]) => ({ department: id === "—" ? "Unassigned" : nameOf.get(id) ?? id, amount_usd }))
    .sort((a, b) => b.amount_usd - a.amount_usd);
}

/** Currency summary: spend by original currency, totaled in USD. */
export async function currencySummary(supabase: DB, range: DateRange) {
  let q = supabase.from("payments").select("currency, amount_original, amount_usd, paid_at");
  if (range.from) q = q.gte("paid_at", range.from);
  if (range.to) q = q.lte("paid_at", `${range.to}T23:59:59`);
  const { data } = await q;
  const map = new Map<string, { original: number; usd: number; count: number }>();
  for (const p of data ?? []) {
    const row = map.get(p.currency) ?? { original: 0, usd: 0, count: 0 };
    row.original += Number(p.amount_original);
    row.usd += Number(p.amount_usd);
    row.count += 1;
    map.set(p.currency, row);
  }
  return [...map.entries()].map(([currency, r]) => ({ currency, original: r.original, usd: r.usd, count: r.count }));
}

/** PO summary: all POs with status + payment + fulfilment. */
export async function poSummary(supabase: DB, range: DateRange) {
  let q = supabase
    .from("purchase_orders")
    .select("id, created_at, supplier, type, status, payment_status, currency, total_original, total_usd")
    .order("created_at", { ascending: false });
  if (range.from) q = q.gte("created_at", range.from);
  if (range.to) q = q.lte("created_at", `${range.to}T23:59:59`);
  const { data } = await q;
  return data ?? [];
}

/** Transaction history: every journal line in range. */
export async function transactionHistory(supabase: DB, range: DateRange) {
  const lines = await fetchLines(supabase, range);
  return lines
    .filter((l) => l.journal_entries && l.accounts)
    .map((l) => ({
      date: l.journal_entries!.entry_date,
      account: l.accounts!.name,
      source: l.journal_entries!.source,
      debit_usd: Number(l.debit_usd),
      credit_usd: Number(l.credit_usd),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Budget vs actual: budgeted vs actual expense per department for the range. */
export async function budgetVsActual(supabase: DB, range: DateRange) {
  const [{ data: budgets }, actuals] = await Promise.all([
    supabase.from("budgets").select("department_id, category, period, amount_usd"),
    expenseByDepartment(supabase, range),
  ]);
  const { data: depts } = await supabase.from("departments").select("id, name");
  const nameOf = new Map((depts ?? []).map((d) => [d.id, d.name]));

  const budgetByDept = new Map<string, number>();
  for (const b of budgets ?? []) {
    if (range.from && b.period < range.from) continue;
    if (range.to && b.period > range.to) continue;
    const key = b.department_id ? nameOf.get(b.department_id) ?? b.department_id : "Unassigned";
    budgetByDept.set(key, (budgetByDept.get(key) ?? 0) + Number(b.amount_usd));
  }

  const actualByDept = new Map(actuals.map((a) => [a.department, a.amount_usd]));
  const keys = new Set([...budgetByDept.keys(), ...actualByDept.keys()]);
  return [...keys].map((department) => {
    const budget = budgetByDept.get(department) ?? 0;
    const actual = actualByDept.get(department) ?? 0;
    return { department, budget, actual, variance: budget - actual };
  });
}
