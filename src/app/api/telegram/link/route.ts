import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

/**
 * POST /api/telegram/link
 *
 * Generates a one-time link token stored on the caller's profile row, then
 * returns a Telegram deep link: https://t.me/BOT?start=link_TOKEN
 *
 * The bot's /start handler verifies the token and writes telegram_id back to
 * the profile, completing the link. Tokens expire after 15 minutes.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  const supabase = await createClient();

  // Generate a short human-typeable code: 3 + 3 uppercase alphanumeric, e.g. "A3K-9PX"
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous I/O/0/1
  const rand = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n))).map((b) => chars[b % chars.length]).join("");
  const code = `${rand(3)}-${rand(3)}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({ telegram_link_token: code, telegram_link_expires_at: expiresAt })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ code, botUsername: botUsername ?? null });
}
