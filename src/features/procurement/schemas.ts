import { z } from "zod";

/** Shared Zod schemas for procurement, used on both client and server. */

export const currencySchema = z.enum(["USD", "KHR", "CNY"]);

export const prItemSchema = z.object({
  name: z.string().min(1, "Required"),
  qty: z.coerce.number().positive("Must be > 0"),
  unit_price_original: z.coerce.number().min(0, "Must be ≥ 0"),
  category: z.string().optional(),
  inventory_item_id: z.string().uuid().optional().nullable(),
});

export const createPrSchema = z.object({
  currency: currencySchema,
  department_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  note: z.string().optional(),
  items: z.array(prItemSchema).min(1, "Add at least one item"),
});
export type CreatePrInput = z.infer<typeof createPrSchema>;

export const decidePrSchema = z.object({
  pr_id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export const poItemSchema = z.object({
  name: z.string().min(1),
  qty_ordered: z.coerce.number().positive(),
  unit_price_original: z.coerce.number().min(0),
  inventory_item_id: z.string().uuid().optional().nullable(),
});

export const createPoSchema = z.object({
  pr_id: z.string().uuid().optional().nullable(),
  type: z.enum(["online", "physical"]),
  supplier: z.string().optional(),
  currency: currencySchema,
  department_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  items: z.array(poItemSchema).min(1),
});
export type CreatePoInput = z.infer<typeof createPoSchema>;

export const recordPaymentSchema = z.object({
  po_id: z.string().uuid().optional().nullable(),
  amount_original: z.coerce.number().positive(),
  currency: currencySchema,
  paid_at: z.string().optional(),
  receipt_object_key: z.string().optional().nullable(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
