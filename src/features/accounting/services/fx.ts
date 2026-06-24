/**
 * FX provider — a single swappable module. Returns rates as currency-per-1-USD
 * (matching exchange_rates.rate_to_usd). Default provider is the free
 * open.er-api.com endpoint (no key); swap `fetchRates` to change providers.
 */

export type RateMap = { KHR: number; CNY: number };

const PROVIDER_URL = "https://open.er-api.com/v6/latest/USD";

export async function fetchRates(): Promise<RateMap> {
  const res = await fetch(PROVIDER_URL, {
    headers: process.env.FX_API_KEY ? { apikey: process.env.FX_API_KEY } : {},
    // Don't cache — we want the day's published rate.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`FX provider error ${res.status}`);

  const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
  if (body.result !== "success" || !body.rates) {
    throw new Error("FX provider returned no rates");
  }

  const khr = body.rates.KHR;
  const cny = body.rates.CNY;
  if (!khr || !cny) throw new Error("FX provider missing KHR/CNY");

  // open.er-api returns "1 USD = N <currency>", i.e. already currency-per-USD.
  return { KHR: khr, CNY: cny };
}
