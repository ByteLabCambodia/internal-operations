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

  const { data: pr, error } = await supabase
    .from("purchase_requests")
    .select("id, pr_number, status, currency, exchange_rate, total_original, total_usd, note, created_at")
    .eq("id", id)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (error || !pr) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: items } = await supabase
    .from("purchase_request_items")
    .select("id, name, qty, unit_price_original")
    .eq("pr_id", id)
    .order("id");

  return NextResponse.json({ ...pr, items: items ?? [] });
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

  const { data: pr } = await supabase
    .from("purchase_requests")
    .select("id, status")
    .eq("id", id)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (!pr) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (pr.status !== "pending") return NextResponse.json({ error: "only pending requests can be edited" }, { status: 400 });

  const items = body.items as Array<{ name: string; qty: number; price: number }>;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);

  const { error: delErr } = await supabase
    .from("purchase_request_items")
    .delete()
    .eq("pr_id", id);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const { error: itemErr } = await supabase
    .from("purchase_request_items")
    .insert(items.map((it) => ({ pr_id: id, name: it.name, qty: it.qty, unit_price_original: it.price })));

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

  const { error: prErr } = await supabase
    .from("purchase_requests")
    .update({ currency: body.currency, exchange_rate: body.rate, total_original: total, note: body.note || null })
    .eq("id", id);

  if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
