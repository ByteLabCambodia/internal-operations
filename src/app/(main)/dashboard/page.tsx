import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CARDS = [
  { title: "My pending items", value: "—", note: "PRs, claims & requests awaiting you" },
  { title: "Low-stock alerts", value: "—", note: "Items at or below reorder point" },
  { title: "Open purchase orders", value: "—", note: "Awaiting payment or fulfilment" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your pending work and stock alerts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardDescription>{c.title}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{c.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{c.note}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phase 0 — scaffold complete</CardTitle>
          <CardDescription>
            App shell, navigation, Supabase/R2/Telegram clients and money utilities are in
            place. Live data arrives once the schema (Phase 1) and procurement flows
            (Phase 3) are built.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
