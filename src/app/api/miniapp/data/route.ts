import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Returns inventory items + latest exchange rates for the Mini App forms. */
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: items }, { data: rateRows }, { data: openPos }] = await Promise.all([
    supabase.from("inventory_items").select("id, sku, name, unit").eq("active", true).order("name"),
    supabase
      .from("exchange_rates")
      .select("currency, rate_to_usd")
      .in("currency", ["KHR", "CNY"])
      .lte("rate_date", today)
      .order("rate_date", { ascending: false })
      .limit(4),
    supabase
      .from("purchase_orders")
      .select("id, po_number, supplier, purchase_order_items(id, name, qty_ordered, qty_claimed)")
      .in("status", ["open", "partial"]),
  ]);

  const rates: Record<string, number> = { USD: 1 };
  for (const r of rateRows ?? []) {
    if (!rates[r.currency]) rates[r.currency] = Number(r.rate_to_usd);
  }

  const pos = (openPos ?? []).map((po) => ({
    id: po.id,
    label: `${po.po_number ?? po.id.slice(0, 8)}${po.supplier ? ` · ${po.supplier}` : ""}`,
    items: ((po.purchase_order_items ?? []) as Array<{ id: string; name: string; qty_ordered: number; qty_claimed: number }>)
      .map((it) => ({ id: it.id, name: it.name, remaining: Number(it.qty_ordered) - Number(it.qty_claimed) }))
      .filter((it) => it.remaining > 0),
  })).filter((po) => po.items.length > 0);

  return NextResponse.json({ items: items ?? [], rates, pos });
}
