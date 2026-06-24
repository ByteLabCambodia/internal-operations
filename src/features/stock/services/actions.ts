"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { notify } from "@/lib/telegram";
import { stockRequestSchema, stockRequestDecisionSchema } from "@/features/stock/schemas";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/** Submit a stock request (any authenticated user). */
export async function submitStockRequest(raw: unknown): Promise<Result> {
  const profile = await requirePermission("stock.request");
  const parsed = stockRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_requests")
    .insert({
      inventory_item_id: parsed.data.inventory_item_id,
      qty: parsed.data.qty,
      note: parsed.data.note ?? null,
      status: "pending",
      requester_id: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await notify("stock_request_submitted", { request_id: data.id });
  revalidatePath("/stock-requests");
  return { ok: true, id: data.id };
}

/**
 * Fulfil or reject a stock request (manager/admin). Fulfil fires the stock
 * trigger (decrement + movement + auto-reorder if at/below reorder point).
 */
export async function decideStockRequest(raw: unknown): Promise<Result> {
  const profile = await requirePermission("stock.fulfil");
  const parsed = stockRequestDecisionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("stock_requests")
    .update({ status: parsed.data.decision, fulfilled_by: profile.id })
    .eq("id", parsed.data.request_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/stock-requests");
  return { ok: true, id: parsed.data.request_id };
}
