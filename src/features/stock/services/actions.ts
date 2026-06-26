"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { notify } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";
import type { Database } from "@/types/database";
import { stockRequestSchema, stockRequestDecisionSchema } from "@/features/stock/schemas";

type StockRequestUpdate = Database["public"]["Tables"]["stock_requests"]["Update"];

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
      priority: parsed.data.priority,
      department: parsed.data.department ?? null,
      note: parsed.data.note ?? null,
      status: "pending",
      requester_id: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, {
    entityType: "stock_request",
    entityId: data.id,
    action: "submitted",
    actorId: profile.id,
    detail: parsed.data.note ? { note: parsed.data.note } : undefined,
  });
  await notify("stock_request_submitted", { request_id: data.id });
  revalidatePath("/stock-requests");
  return { ok: true, id: data.id };
}

/**
 * Approve, fulfil, or reject a stock request (manager/admin). Fulfil fires the
 * stock trigger (decrement + movement + auto-reorder if at/below reorder point).
 */
export async function decideStockRequest(raw: unknown): Promise<Result> {
  const profile = await requirePermission("stock.fulfil");
  const parsed = stockRequestDecisionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { request_id, decision } = parsed.data;

  const supabase = await createClient();

  const patch: StockRequestUpdate = { status: decision };
  if (decision === "approved") {
    patch.approved_by = profile.id;
    patch.approved_at = new Date().toISOString();
  } else if (decision === "fulfilled") {
    patch.fulfilled_by = profile.id;
  }

  const { error } = await supabase.from("stock_requests").update(patch).eq("id", request_id);
  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, {
    entityType: "stock_request",
    entityId: request_id,
    action: decision, // "approved" | "fulfilled" | "rejected"
    actorId: profile.id,
  });
  revalidatePath("/stock-requests");
  return { ok: true, id: request_id };
}
