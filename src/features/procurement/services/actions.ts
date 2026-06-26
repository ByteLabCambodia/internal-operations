"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { getCurrentRate } from "@/lib/rates";
import { round } from "@/lib/money";
import { notify } from "@/lib/telegram";
import { logActivity } from "@/lib/activity";
import {
  createPrSchema,
  decidePrSchema,
  createPoSchema,
  recordPaymentSchema,
} from "@/features/procurement/schemas";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/** Create a purchase request: locks the FX rate, derives USD totals. */
export async function createPurchaseRequest(raw: unknown): Promise<Result> {
  const profile = await requirePermission("pr.create");
  const parsed = createPrSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  const supabase = await createClient();
  const rate = await getCurrentRate(supabase, input.currency);
  const totalOriginal = round(
    input.items.reduce((sum, i) => sum + i.qty * i.unit_price_original, 0),
    4,
  );

  const { data: pr, error } = await supabase
    .from("purchase_requests")
    .insert({
      requester_id: profile.id,
      status: "pending",
      currency: input.currency,
      exchange_rate: rate, // locked at submission
      total_original: totalOriginal,
      department_id: input.department_id ?? null,
      project_id: input.project_id ?? null,
      note: input.note ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const { error: itemsError } = await supabase.from("purchase_request_items").insert(
    input.items.map((i) => ({
      pr_id: pr.id,
      name: i.name,
      qty: i.qty,
      unit_price_original: i.unit_price_original,
      category: i.category ?? null,
      inventory_item_id: i.inventory_item_id ?? null,
    })),
  );
  if (itemsError) return { ok: false, error: itemsError.message };

  await logActivity(supabase, {
    entityType: "purchase_request",
    entityId: pr.id,
    action: "created",
    actorId: profile.id,
    detail: input.note ? { note: input.note } : undefined,
  });
  await notify("pr_created", { pr_id: pr.id, requester_id: profile.id });
  revalidatePath("/purchase-requests");
  return { ok: true, id: pr.id };
}

/** Approve or reject a PR (manager/admin). */
export async function decidePurchaseRequest(raw: unknown): Promise<Result> {
  const profile = await requirePermission("pr.decide");
  const parsed = decidePrSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_requests")
    .update({
      status: parsed.data.decision,
      approver_id: profile.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.pr_id);
  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, {
    entityType: "purchase_request",
    entityId: parsed.data.pr_id,
    action: parsed.data.decision, // "approved" | "rejected"
    actorId: profile.id,
  });
  await notify("pr_decided", { pr_id: parsed.data.pr_id, decision: parsed.data.decision });
  revalidatePath("/purchase-requests");
  revalidatePath(`/purchase-requests/${parsed.data.pr_id}`);
  return { ok: true, id: parsed.data.pr_id };
}

/** Create a PO (from an approved PR for online, or skip-to-pay for physical). */
export async function createPurchaseOrder(raw: unknown): Promise<Result> {
  const profile = await requirePermission("po.create");
  const parsed = createPoSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  const supabase = await createClient();

  const { data: pr } = await supabase
    .from("purchase_requests")
    .select("status")
    .eq("id", input.pr_id)
    .single();
  if (!pr) return { ok: false, error: "Purchase request not found" };
  if (pr.status !== "approved") return { ok: false, error: "Purchase request is not approved" };

  const rate = await getCurrentRate(supabase, input.currency);
  const totalOriginal = round(
    input.items.reduce((sum, i) => sum + i.qty_ordered * i.unit_price_original, 0),
    4,
  );

  const { data: po, error } = await supabase
    .from("purchase_orders")
    .insert({
      pr_id: input.pr_id ?? null,
      supplier: input.supplier ?? null,
      currency: input.currency,
      exchange_rate: rate,
      total_original: totalOriginal,
      department_id: input.department_id ?? null,
      project_id: input.project_id ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const { error: itemsError } = await supabase.from("purchase_order_items").insert(
    input.items.map((i) => ({
      po_id: po.id,
      name: i.name,
      qty_ordered: i.qty_ordered,
      unit_price_original: i.unit_price_original,
      inventory_item_id: i.inventory_item_id ?? null,
    })),
  );
  if (itemsError) return { ok: false, error: itemsError.message };

  await logActivity(supabase, {
    entityType: "purchase_order",
    entityId: po.id,
    action: "created",
    actorId: profile.id,
    detail: input.supplier ? { note: `Supplier: ${input.supplier}` } : undefined,
  });

  // The PR is now fulfilled by this PO — mark it converted.
  if (input.pr_id) {
    await supabase
      .from("purchase_requests")
      .update({ status: "converted" })
      .eq("id", input.pr_id);
    await logActivity(supabase, {
      entityType: "purchase_request",
      entityId: input.pr_id,
      action: "converted",
      actorId: profile.id,
    });
  }

  await notify("po_created", { po_id: po.id });
  revalidatePath("/purchase-orders");
  revalidatePath("/purchase-requests");
  return { ok: true, id: po.id };
}

/** Record a payment (finance/admin). Trigger creates the balanced journal entry. */
export async function recordPayment(raw: unknown): Promise<Result> {
  const profile = await requirePermission("payment.record");
  const parsed = recordPaymentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  const supabase = await createClient();
  const rate = await getCurrentRate(supabase, input.currency);

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      po_id: input.po_id ?? null,
      amount_original: input.amount_original,
      currency: input.currency,
      exchange_rate: rate,
      method: input.method ?? null,
      bank_account: input.bank_account ?? null,
      reference: input.reference ?? null,
      paid_at: input.paid_at ?? new Date().toISOString(),
      receipt_object_key: input.receipt_object_key ?? null,
      recorded_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Log against the PO so the payment surfaces in the order's timeline.
  if (input.po_id) {
    await logActivity(supabase, {
      entityType: "purchase_order",
      entityId: input.po_id,
      action: "payment_recorded",
      actorId: profile.id,
      detail: { note: `${input.amount_original} ${input.currency}` },
    });
  }
  await notify("payment_recorded", { payment_id: payment.id, po_id: input.po_id });
  revalidatePath("/purchase-orders");
  return { ok: true, id: payment.id };
}
