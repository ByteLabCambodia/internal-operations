import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { notify } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = body.items as Array<{ name: string; qty: number; price: number }>;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);

  const { data: pr, error: prErr } = await supabase
    .from("purchase_requests")
    .insert({
      requester_id: user.id,
      status: "pending",
      currency: body.currency,
      exchange_rate: body.rate,
      total_original: total,
      note: body.note || null,
    })
    .select("id")
    .single();

  if (prErr || !pr) return NextResponse.json({ error: prErr?.message ?? "insert failed" }, { status: 500 });

  await supabase.from("purchase_request_items").insert(
    items.map((it) => ({ pr_id: pr.id, name: it.name, qty: it.qty, unit_price_original: it.price })),
  );

  await notify("pr_created", { pr_id: pr.id, requester_id: user.id }).catch(() => {});

  return NextResponse.json({ ok: true, id: pr.id });
}
