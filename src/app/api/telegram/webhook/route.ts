import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getBot, notify } from "@/lib/telegram";
import { can, type UserRole, type Permission } from "@/lib/roles";

/**
 * Telegram bot webhook (grammY for sends; manual routing for control over
 * idempotency and role checks).
 *
 * Security: verifies the secret-token header. Idempotency: each update_id is
 * recorded once (Telegram retries). Inline buttons drive approve/confirm/fulfil
 * flows — the presser's telegram_id is mapped to a profile and their role is
 * checked before the action is applied.
 */

type CallbackConfig = {
  table: "purchase_requests" | "inventory_claims" | "stock_requests";
  permission: Permission;
  patch: (decision: string, actorId: string) => Record<string, unknown>;
};

const CALLBACKS: Record<string, CallbackConfig> = {
  pr: {
    table: "purchase_requests",
    permission: "pr.decide",
    patch: (decision, actorId) => ({ status: decision, approver_id: actorId, decided_at: new Date().toISOString() }),
  },
  claim: {
    table: "inventory_claims",
    permission: "claim.confirm",
    patch: (decision, actorId) => ({ status: decision, confirmed_by: actorId }),
  },
  stock: {
    table: "stock_requests",
    permission: "stock.fulfil",
    patch: (decision, actorId) => ({ status: decision, fulfilled_by: actorId }),
  },
};

export async function POST(request: NextRequest) {
  if (request.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = await request.json().catch(() => null);
  if (!update?.update_id) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  // Idempotency: skip if we've seen this update_id.
  const { error: dupErr } = await admin.from("telegram_updates").insert({ update_id: update.update_id });
  if (dupErr) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (update.callback_query) await handleCallback(admin, update.callback_query);
    else if (update.message?.text) await handleMessage(admin, update.message);
  } catch (err) {
    console.error("webhook handler error", err);
  }

  return NextResponse.json({ ok: true });
}

async function handleCallback(
  admin: ReturnType<typeof createAdminClient>,
  cb: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number; text?: string } },
) {
  const bot = getBot();
  const [entity, decision, id] = (cb.data ?? "").split(":");
  const cfg = CALLBACKS[entity];

  if (!cfg || !id) {
    await bot.api.answerCallbackQuery(cb.id, { text: "Unknown action" });
    return;
  }

  // Map presser -> profile, check role.
  const { data: actor } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("telegram_id", cb.from.id)
    .maybeSingle();

  if (!actor || !can(actor.role as UserRole, cfg.permission)) {
    await bot.api.answerCallbackQuery(cb.id, { text: "You are not authorized.", show_alert: true });
    return;
  }

  const patch = cfg.patch(decision, actor.id) as never;
  const { error } = await admin.from(cfg.table).update(patch).eq("id", id);
  if (error) {
    await bot.api.answerCallbackQuery(cb.id, { text: `Failed: ${error.message}`, show_alert: true });
    return;
  }

  // Edit the original message to show the decision + who decided.
  if (cb.message) {
    const verb = decision.charAt(0).toUpperCase() + decision.slice(1);
    await bot.api
      .editMessageText(
        cb.message.chat.id,
        cb.message.message_id,
        `${cb.message.text ?? ""}\n\n— ${verb} by ${actor.full_name ?? "a manager"}`,
      )
      .catch(() => {});
  }
  await bot.api.answerCallbackQuery(cb.id, { text: `${decision}` });

  // DM the requester for PR/claim decisions.
  if (entity === "pr") await notify("pr_decided", { pr_id: id, decision });
  if (entity === "claim" && decision === "confirmed") await notify("claim_confirmed", { claim_id: id });
}

async function handleMessage(
  admin: ReturnType<typeof createAdminClient>,
  message: { text: string; from?: { id: number; username?: string }; chat: { id: number } },
) {
  const bot = getBot();
  if (!message.from) return;

  const text = message.text.trim();

  // Short-code linking: user types e.g. "A3K-9PX" from the web app.
  // Codes are 7 chars: 3 alphanum + dash + 3 alphanum (case-insensitive).
  const codeMatch = text.match(/^([A-Z2-9]{3}-[A-Z2-9]{3})$/i);
  if (codeMatch) {
    const code = codeMatch[1].toUpperCase();
    const now = new Date().toISOString();

    const { data: profile } = await admin
      .from("profiles")
      .select("id, telegram_id")
      .eq("telegram_link_token", code)
      .gt("telegram_link_expires_at", now)
      .maybeSingle();

    if (!profile) {
      await bot.api.sendMessage(
        message.chat.id,
        "❌ Code not found or expired. Generate a new one from the web app.",
      );
      return;
    }

    if (profile.telegram_id && profile.telegram_id !== message.from.id) {
      await bot.api.sendMessage(message.chat.id, "⚠️ This account is already linked to a different Telegram user.");
      return;
    }

    await admin
      .from("profiles")
      .update({ telegram_id: message.from.id, telegram_link_token: null, telegram_link_expires_at: null })
      .eq("id", profile.id);

    await bot.api.sendMessage(
      message.chat.id,
      "✅ Your Telegram account is now linked! You'll receive notifications here.",
    );
    return;
  }

  if (!text.startsWith("/start")) return;

  // Legacy auto-link by matching telegram_username.
  if (message.from.username) {
    const { data: matched } = await admin
      .from("profiles")
      .select("id")
      .eq("telegram_username", message.from.username)
      .is("telegram_id", null)
      .maybeSingle();
    if (matched) {
      await admin.from("profiles").update({ telegram_id: message.from.id }).eq("id", matched.id);
      await bot.api.sendMessage(message.chat.id, "✅ Your Telegram is now linked to your account.");
      return;
    }
  }

  await bot.api.sendMessage(
    message.chat.id,
    `👋 Welcome to ByteLab Ops Bot!\n\nTo link your account, go to the web app → click your name → <b>Link Telegram account</b> and send the code here.`,
    { parse_mode: "HTML" },
  );
}
