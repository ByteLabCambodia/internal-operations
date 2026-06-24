import { Bot, InlineKeyboard } from "grammy";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatUsd } from "@/lib/money";
import type { UserRole } from "@/lib/roles";

/**
 * Telegram integration. Business logic never calls the Bot API directly — it
 * calls notify(event, payload). This module resolves each event to a
 * destination (group forum topic or personal DM) per the brief's routing table,
 * records a notifications row, and dispatches the message. All sends are
 * best-effort: failures are logged, never thrown, so business actions don't
 * fail when Telegram is unavailable or unconfigured.
 */

let _bot: Bot | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export function getBot(): Bot {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  _bot = new Bot(token);
  return _bot;
}

const MANAGER_GROUP = {
  chat: process.env.TELEGRAM_MANAGER_GROUP_CHAT_ID,
  topic: process.env.TELEGRAM_MANAGER_GROUP_TOPIC_ID,
};
const FINANCE_GROUP = {
  chat: process.env.TELEGRAM_FINANCE_GROUP_CHAT_ID,
  topic: process.env.TELEGRAM_FINANCE_GROUP_TOPIC_ID,
};

export type NotifyEvent =
  | "pr_created"
  | "pr_decided"
  | "po_created"
  | "payment_recorded"
  | "claim_submitted"
  | "claim_confirmed"
  | "stock_request_submitted"
  | "stock_below_reorder"
  | "exchange_rate_updated";

export type NotifyPayload = Record<string, unknown>;

type Admin = ReturnType<typeof createAdminClient>;

/** Low-level send; never throws. Returns the message id on success. */
async function send(
  chatId: string | number,
  text: string,
  opts?: { threadId?: number; keyboard?: InlineKeyboard },
): Promise<number | null> {
  if (!isConfigured()) return null;
  try {
    const msg = await getBot().api.sendMessage(chatId, text, {
      message_thread_id: opts?.threadId,
      reply_markup: opts?.keyboard,
      parse_mode: "HTML",
    });
    return msg.message_id;
  } catch (err) {
    console.error("telegram send failed", err);
    return null;
  }
}

async function telegramIdFor(admin: Admin, userId: string): Promise<number | null> {
  const { data } = await admin.from("profiles").select("telegram_id").eq("id", userId).maybeSingle();
  return data?.telegram_id ?? null;
}

async function usersWithRoles(admin: Admin, roles: UserRole[]) {
  const { data } = await admin
    .from("profiles")
    .select("id, telegram_id")
    .in("role", roles)
    .eq("active", true);
  return data ?? [];
}

/** Record a notification row (in-app inbox) for a user. */
async function record(admin: Admin, userId: string, event: string, payload: NotifyPayload, sent: boolean) {
  await admin
    .from("notifications")
    .insert({ user_id: userId, event, payload: payload as never, telegram_sent: sent });
}

/**
 * Dispatch a notification for a domain event. Resolves recipients, records
 * in-app notifications, and sends Telegram messages per the routing table.
 */
export async function notify(event: NotifyEvent, payload: NotifyPayload): Promise<void> {
  try {
    const admin = createAdminClient();

    switch (event) {
      case "pr_created": {
        const text = `🧾 <b>New Purchase Request</b>\n${await summarizePr(admin, payload.pr_id as string)}`;
        const kb = new InlineKeyboard()
          .text("✅ Approve", `pr:approved:${payload.pr_id}`)
          .text("❌ Reject", `pr:rejected:${payload.pr_id}`);
        if (MANAGER_GROUP.chat) {
          await send(MANAGER_GROUP.chat, text, {
            threadId: MANAGER_GROUP.topic ? Number(MANAGER_GROUP.topic) : undefined,
            keyboard: kb,
          });
        }
        break;
      }
      case "pr_decided": {
        const requesterId = await requesterOfPr(admin, payload.pr_id as string);
        if (requesterId) {
          const tid = await telegramIdFor(admin, requesterId);
          const text = `📣 Your purchase request was <b>${payload.decision}</b>.`;
          if (tid) await send(tid, text);
          await record(admin, requesterId, event, payload, Boolean(tid));
        }
        break;
      }
      case "po_created": {
        const text = `📦 <b>New Purchase Order</b>\n${await summarizePo(admin, payload.po_id as string)}`;
        if (FINANCE_GROUP.chat) {
          await send(FINANCE_GROUP.chat, text, {
            threadId: FINANCE_GROUP.topic ? Number(FINANCE_GROUP.topic) : undefined,
          });
        }
        break;
      }
      case "payment_recorded": {
        const managers = await usersWithRoles(admin, ["manager"]);
        const text = `💵 Payment recorded for a purchase order.`;
        for (const m of managers) {
          if (m.telegram_id) await send(m.telegram_id, text);
          await record(admin, m.id, event, payload, Boolean(m.telegram_id));
        }
        break;
      }
      case "claim_submitted": {
        const text = `📥 <b>Inventory claim submitted</b>`;
        const kb = new InlineKeyboard()
          .text("✅ Confirm", `claim:confirmed:${payload.claim_id}`)
          .text("❌ Reject", `claim:rejected:${payload.claim_id}`);
        if (MANAGER_GROUP.chat) {
          await send(MANAGER_GROUP.chat, text, {
            threadId: MANAGER_GROUP.topic ? Number(MANAGER_GROUP.topic) : undefined,
            keyboard: kb,
          });
        }
        break;
      }
      case "claim_confirmed": {
        const claimerId = await claimerOf(admin, payload.claim_id as string);
        if (claimerId) {
          const tid = await telegramIdFor(admin, claimerId);
          if (tid) await send(tid, `✅ Your inventory claim was confirmed and added to stock.`);
          await record(admin, claimerId, event, payload, Boolean(tid));
        }
        break;
      }
      case "stock_request_submitted": {
        const managers = await usersWithRoles(admin, ["manager"]);
        const kb = new InlineKeyboard()
          .text("✅ Fulfil", `stock:fulfilled:${payload.request_id}`)
          .text("❌ Reject", `stock:rejected:${payload.request_id}`);
        for (const m of managers) {
          if (m.telegram_id) await send(m.telegram_id, `📤 New stock request submitted.`, { keyboard: kb });
          await record(admin, m.id, event, payload, Boolean(m.telegram_id));
        }
        break;
      }
      case "stock_below_reorder": {
        // Trigger already inserted notification rows; flush them.
        await dispatchPendingNotifications();
        break;
      }
      case "exchange_rate_updated": {
        const finance = await usersWithRoles(admin, ["finance"]);
        const text = `💱 Daily exchange rates updated.\n${(payload.summary as string) ?? ""}`;
        for (const f of finance) {
          if (f.telegram_id) await send(f.telegram_id, text);
          await record(admin, f.id, event, payload, Boolean(f.telegram_id));
        }
        break;
      }
    }
  } catch (err) {
    console.error("notify failed", event, err);
  }
}

/**
 * Flush unsent in-app notifications to Telegram DMs (used for trigger-created
 * notifications such as low-stock auto-reorder alerts).
 */
export async function dispatchPendingNotifications(): Promise<void> {
  if (!isConfigured()) return;
  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("notifications")
    .select("id, user_id, event, payload, profiles(telegram_id)")
    .eq("telegram_sent", false)
    .limit(100);

  for (const n of pending ?? []) {
    const tid = (n.profiles as unknown as { telegram_id: number | null } | null)?.telegram_id;
    if (!tid) continue;
    const text = messageForStoredEvent(n.event, n.payload as NotifyPayload);
    const id = await send(tid, text);
    if (id) await admin.from("notifications").update({ telegram_sent: true }).eq("id", n.id);
  }
}

function messageForStoredEvent(event: string, payload: NotifyPayload): string {
  if (event === "stock_below_reorder") {
    return `⚠️ <b>Low stock</b>: ${payload.sku} is at ${payload.stock_qty} (reorder point ${payload.reorder_point}). A draft reorder request was created.`;
  }
  return `🔔 ${event}`;
}

// --- summary/query helpers -------------------------------------------------

async function summarizePr(admin: Admin, prId: string): Promise<string> {
  const { data } = await admin
    .from("purchase_requests")
    .select("currency, total_original, total_usd")
    .eq("id", prId)
    .maybeSingle();
  if (!data) return prId;
  return `${Number(data.total_original)} ${data.currency} (≈ ${formatUsd(Number(data.total_usd))})`;
}

async function summarizePo(admin: Admin, poId: string): Promise<string> {
  const { data } = await admin
    .from("purchase_orders")
    .select("supplier, currency, total_original, total_usd")
    .eq("id", poId)
    .maybeSingle();
  if (!data) return poId;
  return `${data.supplier ?? "PO"} — ${Number(data.total_original)} ${data.currency} (≈ ${formatUsd(Number(data.total_usd))})`;
}

async function requesterOfPr(admin: Admin, prId: string): Promise<string | null> {
  const { data } = await admin.from("purchase_requests").select("requester_id").eq("id", prId).maybeSingle();
  return data?.requester_id ?? null;
}

async function claimerOf(admin: Admin, claimId: string): Promise<string | null> {
  const { data } = await admin.from("inventory_claims").select("claimed_by").eq("id", claimId).maybeSingle();
  return data?.claimed_by ?? null;
}
