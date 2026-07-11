"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { notify } from "@/lib/telegram";
import {
  inventoryItemSchema,
  categorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  claimSchema,
  claimDecisionSchema,
  adjustStockSchema,
} from "@/features/inventory/schemas";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/** Create a category (manager/admin). */
export async function createCategory(raw: unknown): Promise<Result> {
  await requirePermission("inventory.manage");
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name, description: parsed.data.description ?? null })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inventory/categories");
  return { ok: true, id: data.id };
}

/** Rename / re-describe a category (manager/admin). */
export async function updateCategory(raw: unknown): Promise<Result> {
  await requirePermission("inventory.manage");
  const parsed = updateCategorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name, description: parsed.data.description ?? null })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inventory/categories");
  return { ok: true, id: parsed.data.id };
}

/** Delete a category (manager/admin). Items keep their free-text category. */
export async function deleteCategory(raw: unknown): Promise<Result> {
  await requirePermission("inventory.manage");
  const parsed = deleteCategorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inventory/categories");
  return { ok: true };
}

/** Create a catalog item (manager/admin). */
export async function createInventoryItem(raw: unknown): Promise<Result> {
  await requirePermission("inventory.manage");
  const parsed = inventoryItemSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inventory");
  return { ok: true, id: data.id };
}

/** Submit an inventory claim against a PO item (any authenticated user). */
export async function submitClaim(raw: unknown): Promise<Result> {
  const profile = await requirePermission("claim.submit");
  const parsed = claimSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_claims")
    .insert({
      po_id: parsed.data.po_id,
      po_item_id: parsed.data.po_item_id,
      inventory_item_id: parsed.data.inventory_item_id,
      qty_claimed: parsed.data.qty_claimed,
      receipt_object_key: parsed.data.receipt_object_key ?? null,
      status: "pending",
      claimed_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await notify("claim_submitted", { claim_id: data.id });
  revalidatePath("/claims");
  return { ok: true, id: data.id };
}

/** Confirm or reject a claim (manager/admin). Confirm fires the stock trigger. */
export async function decideClaim(raw: unknown): Promise<Result> {
  const profile = await requirePermission("claim.confirm");
  const parsed = claimDecisionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory_claims")
    .update({ status: parsed.data.decision, confirmed_by: profile.id })
    .eq("id", parsed.data.claim_id);
  if (error) return { ok: false, error: error.message };

  if (parsed.data.decision === "confirmed") {
    await notify("claim_confirmed", { claim_id: parsed.data.claim_id });
  }
  revalidatePath("/claims");
  return { ok: true, id: parsed.data.claim_id };
}

/** Manual stock adjustment via SECURITY DEFINER RPC (manager/admin). */
export async function adjustStock(raw: unknown): Promise<Result> {
  await requirePermission("inventory.manage");
  const parsed = adjustStockSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_stock", {
    p_item: parsed.data.inventory_item_id,
    p_delta: parsed.data.delta,
    p_note: parsed.data.note ?? undefined,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${parsed.data.inventory_item_id}`);
  return { ok: true };
}
