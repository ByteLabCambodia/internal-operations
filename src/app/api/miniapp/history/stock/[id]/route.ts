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

  const { data: sr, error } = await supabase
    .from("stock_requests")
    .select("id, qty, status, note, created_at, inventory_item_id")
    .eq("id", id)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (error || !sr) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: item } = await supabase
    .from("inventory_items")
    .select("name, sku, unit")
    .eq("id", sr.inventory_item_id)
    .maybeSingle();

  return NextResponse.json({ ...sr, item_name: item?.name ?? "Unknown", sku: item?.sku ?? "—", unit: item?.unit ?? "" });
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

  const { data: sr } = await supabase
    .from("stock_requests")
    .select("id, status")
    .eq("id", id)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (!sr) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (sr.status !== "pending") return NextResponse.json({ error: "only pending requests can be edited" }, { status: 400 });

  const qty = Number(body.qty);
  if (!qty || qty <= 0) return NextResponse.json({ error: "invalid qty" }, { status: 400 });

  const { error } = await supabase
    .from("stock_requests")
    .update({ qty, note: body.note || null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
