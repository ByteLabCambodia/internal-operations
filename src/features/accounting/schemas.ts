import { z } from "zod";

export const currencySchema = z.enum(["USD", "KHR", "CNY"]);

export const incomeSchema = z.object({
  amount_original: z.coerce.number().positive(),
  currency: currencySchema,
  account_id: z.string().uuid(), // income account to credit
  entry_date: z.string().optional(),
  memo: z.string().optional(),
  department_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
});
export type IncomeInput = z.infer<typeof incomeSchema>;

export const rateSchema = z.object({
  rate_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  currency: z.enum(["KHR", "CNY"]),
  rate_to_usd: z.coerce.number().positive(),
});
export type RateInput = z.infer<typeof rateSchema>;
