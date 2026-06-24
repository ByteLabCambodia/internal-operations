import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRates } from "@/features/accounting/services/fx";
import { notify } from "@/lib/telegram";

/**
 * Daily FX rate refresh (Vercel Cron). Verifies CRON_SECRET, pulls USD-base
 * rates for KHR & CNY from the swappable FX module, upserts today's rates
 * (source 'api'), and DMs a daily summary to Finance.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; we also accept
 * `?secret=` for manual triggers.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qsSecret = new URL(request.url).searchParams.get("secret");
  if (!secret || (auth !== `Bearer ${secret}` && qsSecret !== secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let rates;
  try {
    rates = await fetchRates();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fx failed" },
      { status: 502 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();
  const rows = [
    { rate_date: today, currency: "USD" as const, rate_to_usd: 1, source: "api" as const },
    { rate_date: today, currency: "KHR" as const, rate_to_usd: rates.KHR, source: "api" as const },
    { rate_date: today, currency: "CNY" as const, rate_to_usd: rates.CNY, source: "api" as const },
  ];

  const { error } = await admin.from("exchange_rates").upsert(rows, { onConflict: "rate_date,currency" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await notify("exchange_rate_updated", {
    summary: `KHR ${rates.KHR.toFixed(2)}/USD · CNY ${rates.CNY.toFixed(4)}/USD`,
  });

  return NextResponse.json({ ok: true, date: today, rates });
}
