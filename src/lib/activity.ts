import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export type ActivityEntityType =
  | "purchase_request"
  | "purchase_order"
  | "payment"
  | "stock_request";

export type ActivityAction =
  | "created"
  | "submitted"
  | "approved"
  | "rejected"
  | "converted"
  | "cancelled"
  | "payment_recorded"
  | "fulfilled";

/**
 * Append one row to the activity timeline. Logging is best-effort: a failure
 * here must never roll back the business mutation that triggered it, so errors
 * are swallowed (and surfaced to the server console) rather than thrown.
 *
 * `actorId` is the acting user's profile id (= auth.uid()); the RLS insert
 * policy requires actor_id to match the signed-in user.
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  args: {
    entityType: ActivityEntityType;
    entityId: string;
    action: ActivityAction;
    actorId: string;
    detail?: Record<string, Json>;
  },
): Promise<void> {
  const { error } = await supabase.from("activity_events").insert({
    entity_type: args.entityType,
    entity_id: args.entityId,
    action: args.action,
    actor_id: args.actorId,
    detail: args.detail ?? null,
  });
  if (error) console.error("logActivity failed:", error.message);
}
