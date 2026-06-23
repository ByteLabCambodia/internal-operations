import { NextResponse } from "next/server";

/**
 * Telegram Mini App auth bridge. Implemented in Phase 2/5.
 *
 * Receives Telegram `initData`, validates its HMAC signature against the bot
 * token (rejecting stale/invalid data), maps telegram_id -> profiles, then
 * mints a Supabase session so RLS applies normally inside the Mini App.
 */
export async function POST() {
  return NextResponse.json({ ok: true, phase: "stub" });
}
