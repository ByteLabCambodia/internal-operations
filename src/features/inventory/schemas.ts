import { z } from "zod";

export const inventoryItemSchema = z.object({
  sku: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  category: z.string().optional(),
  unit: z.string().min(1).default("pcs"),
  reorder_point: z.coerce.number().min(0).default(0),
  reorder_qty: z.coerce.number().min(0).default(0),
});
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const claimSchema = z.object({
  po_id: z.string().uuid(),
  po_item_id: z.string().uuid(),
  inventory_item_id: z.string().uuid(),
  qty_claimed: z.coerce.number().positive(),
});

export const claimDecisionSchema = z.object({
  claim_id: z.string().uuid(),
  decision: z.enum(["confirmed", "rejected"]),
});

export const adjustStockSchema = z.object({
  inventory_item_id: z.string().uuid(),
  delta: z.coerce.number().refine((n) => n !== 0, "Delta must be non-zero"),
  note: z.string().optional(),
});
