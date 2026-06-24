"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { getCurrentRate } from "@/lib/rates";
import { toUsd } from "@/lib/money";
import { incomeSchema, rateSchema } from "@/features/accounting/schemas";

type Result = { ok: true; id?: string } | { ok: false; error: string };

const CASH_ACCOUNT_CODE = "1000";

/**
 * Record a manual income entry (finance/admin): DR Cash / CR the chosen income
 * account. The two lines are inserted in one statement so the deferred balance
 * constraint passes.
 */
export async function addIncome(raw: unknown): Promise<Result> {
  const profile = await requirePermission("income.add");
  const parsed = incomeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  const supabase = await createClient();
  const rate = await getCurrentRate(supabase, input.currency);
  const amountUsd = toUsd(input.amount_original, rate);

  const { data: cash } = await supabase
    .from("accounts")
    .select("id")
    .eq("code", CASH_ACCOUNT_CODE)
    .single();
  if (!cash) return { ok: false, error: "Cash account not found" };

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      entry_date: input.entry_date ?? new Date().toISOString().slice(0, 10),
      memo: input.memo ?? "Manual income",
      currency: input.currency,
      exchange_rate: rate,
      source: "manual_income",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const { error: linesError } = await supabase.from("journal_lines").insert([
    {
      entry_id: entry.id,
      account_id: cash.id,
      debit_usd: amountUsd,
      credit_usd: 0,
      dimension_department_id: input.department_id ?? null,
      dimension_project_id: input.project_id ?? null,
    },
    {
      entry_id: entry.id,
      account_id: input.account_id,
      debit_usd: 0,
      credit_usd: amountUsd,
      dimension_department_id: input.department_id ?? null,
      dimension_project_id: input.project_id ?? null,
    },
  ]);
  if (linesError) {
    // Roll back the orphaned header (lines failed the balance check).
    await supabase.from("journal_entries").delete().eq("id", entry.id);
    return { ok: false, error: linesError.message };
  }

  revalidatePath("/accounting");
  return { ok: true, id: entry.id };
}

/** Override / set a daily exchange rate (finance/admin). */
export async function upsertRate(raw: unknown): Promise<Result> {
  await requirePermission("rate.override");
  const parsed = rateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exchange_rates")
    .upsert(
      { ...parsed.data, source: "manual" },
      { onConflict: "rate_date,currency" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/accounting");
  return { ok: true };
}
