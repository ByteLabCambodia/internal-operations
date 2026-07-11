import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import type { Currency } from "@/lib/money";
import { PrForm } from "@/features/procurement/components/pr-form";

export default async function NewPurchaseRequestPage() {
  await requirePermission("pr.create");
  const supabase = await createClient();

  const [{ data: departments }, { data: projects }, { data: rates }] = await Promise.all([
    supabase.from("departments").select("id, name").eq("active", true).order("name"),
    supabase.from("projects").select("id, name").eq("active", true).order("name"),
    supabase.from("exchange_rates").select("currency, rate_to_usd, rate_date").order("rate_date", { ascending: false }),
  ]);

  // Most recent rate per currency (currency per 1 USD).
  const rateMap: Record<Currency, number> = { USD: 1, KHR: 0, CNY: 0 };
  for (const r of rates ?? []) {
    const c = r.currency as Currency;
    if (c !== "USD" && rateMap[c] === 0) rateMap[c] = Number(r.rate_to_usd);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Purchase Request</h1>
        <p className="text-sm text-muted-foreground">
          The exchange rate is locked when you submit. USD totals use the locked rate.
        </p>
      </div>
      <PrForm
        departments={departments ?? []}
        projects={projects ?? []}
        rates={rateMap}
      />
    </div>
  );
}
