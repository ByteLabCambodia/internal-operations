import { createClient } from "@/lib/supabase/server";
import { requirePermission, getProfile } from "@/lib/auth";
import { can, type UserRole } from "@/lib/roles";
import { formatUsd } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncomeForm } from "@/features/accounting/components/income-form";
import { RateForm } from "@/features/accounting/components/rate-form";

export default async function AccountingPage() {
  await requirePermission("accounting.view");
  const supabase = await createClient();
  const profile = await getProfile();
  const role = profile?.role as UserRole | undefined;
  const canIncome = role && can(role, "income.add");
  const canRate = role && can(role, "rate.override");

  const [{ data: accounts }, { data: entries }, { data: rates }] = await Promise.all([
    supabase.from("accounts").select("id, code, name, type").order("code"),
    supabase
      .from("journal_entries")
      .select("id, entry_date, memo, source, journal_lines(debit_usd)")
      .order("entry_date", { ascending: false })
      .limit(25),
    supabase
      .from("exchange_rates")
      .select("rate_date, currency, rate_to_usd, source")
      .order("rate_date", { ascending: false })
      .limit(15),
  ]);

  const incomeAccounts = (accounts ?? []).filter((a) => a.type === "income");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounting</h1>
        <p className="text-sm text-muted-foreground">Journal, chart of accounts, and exchange rates.</p>
      </div>

      {canIncome && (
        <Card>
          <CardHeader><CardTitle>Record income</CardTitle></CardHeader>
          <CardContent><IncomeForm incomeAccounts={incomeAccounts} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent journal entries</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries ?? []).map((e) => {
                const amount = (e.journal_lines as { debit_usd: number }[]).reduce(
                  (s, l) => s + Number(l.debit_usd),
                  0,
                );
                return (
                  <TableRow key={e.id}>
                    <TableCell>{e.entry_date}</TableCell>
                    <TableCell>{e.memo ?? "—"}</TableCell>
                    <TableCell className="capitalize">{e.source.replace("_", " ")}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(amount)}</TableCell>
                  </TableRow>
                );
              })}
              {(entries ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No journal entries yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Chart of accounts</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(accounts ?? []).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{a.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Exchange rates</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {canRate && <RateForm />}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Per USD</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rates ?? []).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.rate_date}</TableCell>
                    <TableCell>{r.currency}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.rate_to_usd)}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{r.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
