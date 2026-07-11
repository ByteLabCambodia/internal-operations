import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: prs }, { data: stocks }, { data: claims }] = await Promise.all([
    supabase
      .from("purchase_requests")
      .select("id, pr_number, status, total_original, currency, created_at")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("stock_requests")
      .select("id, qty, status, created_at, inventory_item_id")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("inventory_claims")
      .select("id, qty_claimed, status, created_at, inventory_item_id")
      .eq("claimed_by", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Batch-resolve inventory item names for stocks + claims.
  const itemIds = Array.from(
    new Set([
      ...(stocks ?? []).map((r) => r.inventory_item_id).filter(Boolean),
      ...(claims ?? []).map((r) => r.inventory_item_id).filter(Boolean),
    ]),
  );

  const itemMap: Record<string, { name: string; sku: string }> = {};
  if (itemIds.length > 0) {
    const { data: invItems } = await supabase
      .from("inventory_items")
      .select("id, name, sku")
      .in("id", itemIds);
    for (const it of invItems ?? []) itemMap[it.id] = { name: it.name, sku: it.sku };
  }

  return NextResponse.json({
    prs: (prs ?? []).map((r) => ({
      id: r.id,
      pr_number: r.pr_number ?? r.id.slice(0, 8),
      status: r.status,
      total_original: r.total_original,
      currency: r.currency,
      created_at: r.created_at,
    })),
    stockRequests: (stocks ?? []).map((r) => ({
      id: r.id,
      item_name: itemMap[r.inventory_item_id]?.name ?? "Unknown item",
      sku: itemMap[r.inventory_item_id]?.sku ?? "—",
      qty: r.qty,
      status: r.status,
      created_at: r.created_at,
    })),
    claims: (claims ?? []).map((r) => ({
      id: r.id,
      item_name: itemMap[r.inventory_item_id]?.name ?? "Unknown item",
      sku: itemMap[r.inventory_item_id]?.sku ?? "—",
      qty_claimed: r.qty_claimed,
      status: r.status,
      created_at: r.created_at,
    })),
  });
}
