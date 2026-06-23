import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Currency } from "@/lib/money";

/**
 * Returns the exchange rate (currency per 1 USD) to LOCK onto a record at
 * submission time. USD is always 1. For KHR/CNY we take the most recent
 * exchange_rates row on/before today. Throws if no rate is configured.
 */
export async function getCurrentRate(
  supabase: SupabaseClient<Database>,
  currency: Currency,
): Promise<number> {
  if (currency === "USD") return 1;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("rate_to_usd")
    .eq("currency", currency)
    .lte("rate_date", today)
    .order("rate_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`No exchange rate configured for ${currency}`);
  return Number(data.rate_to_usd);
}
