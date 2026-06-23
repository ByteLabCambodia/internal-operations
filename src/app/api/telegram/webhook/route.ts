import { NextResponse } from "next/server";

/**
 * Telegram bot webhook. Implemented in Phase 5 with grammY.
 *
 * Must verify the `X-Telegram-Bot-Api-Secret-Token` header against
 * TELEGRAM_WEBHOOK_SECRET, and be idempotent on `update_id` (Telegram retries).
 */
export async function POST() {
  return NextResponse.json({ ok: true, phase: "stub" });
}
