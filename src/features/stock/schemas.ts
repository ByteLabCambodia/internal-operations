import { z } from "zod";

export const stockPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const stockRequestSchema = z.object({
  inventory_item_id: z.string().uuid(),
  qty: z.coerce.number().positive(),
  priority: stockPrioritySchema.default("medium"),
  department: z.string().optional(),
  note: z.string().optional(),
});

export const stockRequestDecisionSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(["approved", "fulfilled", "rejected"]),
});
