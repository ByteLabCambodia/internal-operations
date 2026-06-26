import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = makeClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: cl, error } = await supabase
    .from("inventory_claims")
    .select("id, qty_claimed, status, created_at, inventory_item_id, po_id, po_item_id")
    .eq("id", id)
    .eq("claimed_by", user.id)
    .maybeSingle();

  if (error || !cl) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [{ data: item }, { data: po }] = await Promise.all([
    supabase.from("inventory_items").select("name, sku").eq("id", cl.inventory_item_id).maybeSingle(),
    cl.po_id ? supabase.from("purchase_orders").select("po_number, supplier").eq("id", cl.po_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    ...cl,
    item_name: item?.name ?? "Unknown",
    sku: item?.sku ?? "—",
    po_number: po?.po_number ?? null,
    supplier: po?.supplier ?? null,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const supabase = makeClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: cl } = await supabase
    .from("inventory_claims")
    .select("id, status")
    .eq("id", id)
    .eq("claimed_by", user.id)
    .maybeSingle();

  if (!cl) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (cl.status !== "pending") return NextResponse.json({ error: "only pending claims can be edited" }, { status: 400 });

  const qty = Number(body.qty_claimed);
  if (!qty || qty <= 0) return NextResponse.json({ error: "invalid qty" }, { status: 400 });

  const { error } = await supabase
    .from("inventory_claims")
    .update({ qty_claimed: qty })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
