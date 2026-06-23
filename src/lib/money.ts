/**
 * Centralized money math. The brief mandates that ALL currency conversion,
 * rounding, and formatting live here so behavior is identical everywhere.
 *
 * Rules:
 *  - Base reporting currency is USD.
 *  - `exchange_rate` is units of currency per 1 USD (e.g. 7.24 CNY/USD).
 *  - amount_usd = amount_original / exchange_rate, rounded to 4 dp.
 *  - Storage precision: 4 dp (matches Postgres numeric(18,4)).
 *  - Display precision: 2 dp.
 *
 * Note: the authoritative conversion also runs as a Postgres trigger so the
 * invariant holds for any client. This module mirrors that math for the UI.
 */

export type Currency = "USD" | "KHR" | "CNY";

export const STORAGE_DP = 4;
export const DISPLAY_DP = 2;

/** Round a number to `dp` decimal places (half-up). */
export function round(value: number, dp: number = STORAGE_DP): number {
  const factor = 10 ** dp;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Convert an original amount to USD using a locked rate (currency-per-USD).
 * USD always converts 1:1. Returns a value rounded to storage precision.
 */
export function toUsd(amountOriginal: number, exchangeRate: number): number {
  if (exchangeRate <= 0) {
    throw new Error("exchange_rate must be > 0");
  }
  return round(amountOriginal / exchangeRate, STORAGE_DP);
}

const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: "en-US",
  KHR: "km-KH",
  CNY: "zh-CN",
};

/** Format a money amount for display (2 dp, currency symbol). */
export function format(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: DISPLAY_DP,
    maximumFractionDigits: DISPLAY_DP,
  }).format(amount);
}

/** Convenience formatter for USD figures used across reports. */
export function formatUsd(amount: number): string {
  return format(amount, "USD");
}
