import { NextResponse } from "next/server";

/**
 * Daily FX rate refresh (Vercel Cron). Implemented in Phase 6.
 *
 * Must verify the CRON_SECRET, pull USD-base rates for KHR & CNY from a
 * swappable FX provider module, upsert into `exchange_rates`, and DM a daily
 * summary to Finance.
 */
export async function GET() {
  return NextResponse.json({ ok: true, phase: "stub" });
}
