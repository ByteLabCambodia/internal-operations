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

  // Reconstruct the real public origin when behind a reverse proxy (ngrok, cloudflare tunnel, Vercel).
  // Priority: ?url= param > x-forwarded headers > request origin.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const inferredOrigin =
    forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;
  const baseUrl = searchParams.get("url") ?? inferredOrigin;
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  let bot;
  try {
    bot = getBot();
  } catch {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 500 });
  }

  try {
    await bot.api.setWebhook(webhookUrl, {
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
      allowed_updates: ["message", "callback_query"],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), webhook_url: webhookUrl },
      { status: 500 },
    );
  }

  const info = await bot.api.getWebhookInfo();

  return NextResponse.json({
    ok: true,
    webhook_url: webhookUrl,
    telegram_confirms: info.url,
    pending_updates: info.pending_update_count,
  });
}
