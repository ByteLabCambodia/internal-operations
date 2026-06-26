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
  if (!botUsername) return NextResponse.json({ error: "Bot not configured" }, { status: 503 });

  const supabase = await createClient();
  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({ telegram_link_token: token, telegram_link_expires_at: expiresAt })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = `https://t.me/${botUsername}?start=link_${token}`;
  return NextResponse.json({ url });
}
