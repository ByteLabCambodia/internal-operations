import { NextResponse, type NextRequest } from "next/server";

import { getBot } from "@/lib/telegram";

/**
 * One-shot admin endpoint to register the Telegram webhook.
 *
 * Call once after each new deployment:
 *   GET /api/telegram/setup?secret=<CRON_SECRET>
 *
 * Telegram will then POST every update to /api/telegram/webhook.
 * Secured with CRON_SECRET — reuses the same secret as the cron endpoint.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const { searchParams, origin } = new URL(request.url);

  if (!secret || searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const webhookUrl = `${origin}/api/telegram/webhook`;
  const bot = getBot();

  await bot.api.setWebhook(webhookUrl, {
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
    allowed_updates: ["message", "callback_query"],
  });

  const info = await bot.api.getWebhookInfo();

  return NextResponse.json({
    ok: true,
    webhook_url: webhookUrl,
    telegram_confirms: info.url,
    pending_updates: info.pending_update_count,
  });
}
