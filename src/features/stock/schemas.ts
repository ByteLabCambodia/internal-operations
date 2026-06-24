import { z } from "zod";

export const stockRequestSchema = z.object({
  inventory_item_id: z.string().uuid(),
  qty: z.coerce.number().positive(),
  note: z.string().optional(),
});

export const stockRequestDecisionSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(["fulfilled", "rejected"]),
});
