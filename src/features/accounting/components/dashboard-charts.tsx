"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/money";

type MonthRow = { month: string; income: number; expense: number };
type CategoryRow = { category: string; amount_usd: number };
type DepartmentRow = { department: string; amount_usd: number };

const PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
const BLUE = "#2563eb";
const GREEN = "#10b981";
const RED = "#ef4444";

/** "2026-06" -> "Jun 26". */
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

const usdTip = (v: unknown) => formatUsd(Number(v));

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-65 items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function DashboardCharts({
  byMonth,
  byCategory,
  byDepartment,
}: {
  byMonth: MonthRow[];
  byCategory: CategoryRow[];
  byDepartment: DepartmentRow[];
}) {
  const months = byMonth.map((r) => ({ ...r, label: monthLabel(r.month) }));
  const categories = byCategory.filter((c) => c.amount_usd > 0);
  const departments = byDepartment.filter((d) => d.amount_usd > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <Empty label="No expense data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={usdTip} />
                <Bar dataKey="expense" name="Expense" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cash flow trend</CardTitle>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <Empty label="No cash flow data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={months}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={usdTip} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke={GREEN} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke={RED} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Expenses by category</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <Empty label="No categorised expenses yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="amount_usd"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={usdTip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Spending by department</CardTitle>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <Empty label="No department spending yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departments} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="department" fontSize={12} tickLine={false} axisLine={false} width={96} />
                <Tooltip formatter={usdTip} />
                <Bar dataKey="amount_usd" name="Spend" fill={GREEN} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
