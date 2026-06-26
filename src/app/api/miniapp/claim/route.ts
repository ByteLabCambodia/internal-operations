import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { notify } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { poId, poItemId, inventoryItemId, qty } = body as {
    poId: string;
    poItemId: string;
    inventoryItemId: string;
    qty: number;
  };

  if (!poId || !poItemId || !inventoryItemId || !qty || qty <= 0) {
    return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: claim, error } = await supabase
    .from("inventory_claims")
    .insert({
      claimed_by: user.id,
      po_id: poId,
      po_item_id: poItemId,
      inventory_item_id: inventoryItemId,
      qty_claimed: qty,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !claim) return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });

  await notify("claim_submitted", { claim_id: claim.id }).catch(() => {});

  return NextResponse.json({ ok: true, id: claim.id });
}
