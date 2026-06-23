import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import type { Currency } from "@/lib/money";
import { PoForm } from "@/features/procurement/components/po-form";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ pr?: string }>;
}) {
  await requirePermission("po.create");
  const { pr: prId } = await searchParams;
  const supabase = await createClient();

  const [{ data: departments }, { data: projects }, { data: rates }, { data: approvedPrs }] =
    await Promise.all([
      supabase.from("departments").select("id, name").eq("active", true).order("name"),
      supabase.from("projects").select("id, name").eq("active", true).order("name"),
      supabase.from("exchange_rates").select("currency, rate_to_usd, rate_date").order("rate_date", { ascending: false }),
      supabase
        .from("purchase_requests")
        .select("id, currency, total_original, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
    ]);

  const rateMap: Record<Currency, number> = { USD: 1, KHR: 0, CNY: 0 };
  for (const r of rates ?? []) {
    const c = r.currency as Currency;
    if (c !== "USD" && rateMap[c] === 0) rateMap[c] = Number(r.rate_to_usd);
  }

  // Prefill from an approved PR if requested.
  let prefill = null as null | {
    pr_id: string;
    currency: Currency;
    department_id: string | null;
    project_id: string | null;
    items: { name: string; qty_ordered: number; unit_price_original: number; inventory_item_id: string | null }[];
  };
  if (prId) {
    const { data: pr } = await supabase
      .from("purchase_requests")
      .select("id, currency, department_id, project_id, status")
      .eq("id", prId)
      .maybeSingle();
    if (pr && pr.status === "approved") {
      const { data: prItems } = await supabase
        .from("purchase_request_items")
        .select("name, qty, unit_price_original, inventory_item_id")
        .eq("pr_id", prId);
      prefill = {
        pr_id: pr.id,
        currency: pr.currency as Currency,
        department_id: pr.department_id,
        project_id: pr.project_id,
        items: (prItems ?? []).map((i) => ({
          name: i.name,
          qty_ordered: Number(i.qty),
          unit_price_original: Number(i.unit_price_original),
          inventory_item_id: i.inventory_item_id,
        })),
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Purchase Order</h1>
        <p className="text-sm text-muted-foreground">
          Create from an approved request (online) or record a physical purchase directly.
        </p>
      </div>
      <PoForm
        departments={departments ?? []}
        projects={projects ?? []}
        rates={rateMap}
        approvedPrs={(approvedPrs ?? []).map((p) => ({ id: p.id, currency: p.currency as Currency }))}
        prefill={prefill}
      />
    </div>
  );
}
