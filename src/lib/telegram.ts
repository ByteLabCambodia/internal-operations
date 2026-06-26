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
        const pr = await fetchPr(admin, payload.pr_id as string);
        const text = pr
          ? [
              `🧾 <b>New Purchase Request ${pr.pr_number}</b>`,
              `👤 ${pr.requester}`,
              pr.items.length > 0
                ? "\nItems:\n" + pr.items.map((it) =>
                    `• ${it.name} × ${Number(it.qty)} @ ${Number(it.unit_price_original)} ${pr.currency}`
                  ).join("\n")
                : "",
              `\n💰 Total: ${Number(pr.total_original)} ${pr.currency} (≈ ${formatUsd(Number(pr.total_usd))})`,
              pr.note ? `📝 ${pr.note}` : "",
            ].filter(Boolean).join("\n")
          : `🧾 <b>New Purchase Request</b>`;
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
        const pr = await fetchPr(admin, payload.pr_id as string);
        const requesterId = pr?.requester_id ?? await requesterOfPr(admin, payload.pr_id as string);
        if (requesterId) {
          const tid = await telegramIdFor(admin, requesterId);
          const icon = payload.decision === "approved" ? "✅" : "❌";
          const text = pr
            ? [
                `${icon} Your purchase request <b>${pr.pr_number}</b> was <b>${payload.decision}</b>.`,
                pr.items.length > 0
                  ? pr.items.map((it) => `• ${it.name} × ${Number(it.qty)}`).join("\n")
                  : "",
                `💰 ${Number(pr.total_original)} ${pr.currency} (≈ ${formatUsd(Number(pr.total_usd))})`,
              ].filter(Boolean).join("\n")
            : `${icon} Your purchase request was <b>${payload.decision}</b>.`;
          if (tid) await send(tid, text);
          await record(admin, requesterId, event, payload, Boolean(tid));
        }
        break;
      }
      case "po_created": {
        const po = await fetchPo(admin, payload.po_id as string);
        const text = po
          ? `📦 <b>New Purchase Order ${po.po_number}</b>\n` +
            `🏭 ${po.supplier ?? "No supplier"}\n` +
            `💰 ${Number(po.total_original)} ${po.currency} (≈ ${formatUsd(Number(po.total_usd))})`
          : `📦 <b>New Purchase Order</b>`;
        if (FINANCE_GROUP.chat) {
          await send(FINANCE_GROUP.chat, text, {
            threadId: FINANCE_GROUP.topic ? Number(FINANCE_GROUP.topic) : undefined,
          });
        }
        break;
      }
      case "payment_recorded": {
        const pay = await fetchPayment(admin, payload.payment_id as string);
        const managers = await usersWithRoles(admin, ["manager"]);
        const text = pay
          ? `💵 <b>Payment recorded</b> for <b>${pay.po_number}</b>\n` +
            `💰 ${Number(pay.amount_original)} ${pay.currency} (≈ ${formatUsd(Number(pay.amount_usd))})\n` +
            `🏭 ${pay.supplier ?? "—"}`
          : `💵 Payment recorded for a purchase order.`;
        for (const m of managers) {
          if (m.telegram_id) await send(m.telegram_id, text);
          await record(admin, m.id, event, payload, Boolean(m.telegram_id));
        }
        break;
      }
      case "claim_submitted": {
        const claim = await fetchClaim(admin, payload.claim_id as string);
        const text = claim
          ? `📥 <b>Inventory claim submitted</b>\n` +
            `📦 ${claim.sku} · ${claim.item_name}\n` +
            `🔢 Qty: ${Number(claim.qty_claimed)}\n` +
            `👤 ${claim.claimer}`
          : `📥 <b>Inventory claim submitted</b>`;
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
        const claim = await fetchClaim(admin, payload.claim_id as string);
        const claimerId = claim?.claimer_id ?? await claimerOf(admin, payload.claim_id as string);
        if (claimerId) {
          const tid = await telegramIdFor(admin, claimerId);
          const text = claim
            ? `✅ Your inventory claim was confirmed.\n📦 ${claim.sku} · ${claim.item_name} × ${Number(claim.qty_claimed)} added to stock.`
            : `✅ Your inventory claim was confirmed and added to stock.`;
          if (tid) await send(tid, text);
          await record(admin, claimerId, event, payload, Boolean(tid));
        }
        break;
      }
      case "stock_request_submitted": {
        const sr = await fetchStockRequest(admin, payload.request_id as string);
        const managers = await usersWithRoles(admin, ["manager"]);
        const text = sr
          ? [
              `📤 <b>New stock request</b>`,
              `📦 ${sr.sku} · ${sr.item_name}`,
              `🔢 Qty: ${Number(sr.qty)}  Priority: ${sr.priority}`,
              `👤 ${sr.requester}${sr.department ? ` · ${sr.department}` : ""}`,
              sr.note ? `📝 ${sr.note}` : "",
            ].filter(Boolean).join("\n")
          : `📤 New stock request submitted.`;
        const kb = new InlineKeyboard()
          .text("✅ Fulfil", `stock:fulfilled:${payload.request_id}`)
          .text("❌ Reject", `stock:rejected:${payload.request_id}`);
        for (const m of managers) {
          if (m.telegram_id) await send(m.telegram_id, text, { keyboard: kb });
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

// --- query helpers -------------------------------------------------

async function fetchPr(admin: Admin, prId: string) {
  const { data, error } = await admin
    .from("purchase_requests")
    .select("pr_number, requester_id, currency, total_original, total_usd, note")
    .eq("id", prId)
    .maybeSingle();
  if (error) { console.error("fetchPr error", error); return null; }
  if (!data) { console.error("fetchPr: no row for", prId); return null; }

  const [{ data: profile }, { data: lineItems }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", data.requester_id).maybeSingle(),
    admin.from("purchase_request_items").select("name, qty, unit_price_original").eq("pr_id", prId).order("id"),
  ]);

  return {
    pr_number: data.pr_number,
    requester_id: data.requester_id,
    requester: profile?.full_name ?? "Unknown",
    currency: data.currency,
    total_original: data.total_original,
    total_usd: data.total_usd,
    note: data.note,
    items: lineItems ?? [],
  };
}

async function fetchPo(admin: Admin, poId: string) {
  const { data } = await admin
    .from("purchase_orders")
    .select("po_number, supplier, currency, total_original, total_usd")
    .eq("id", poId)
    .maybeSingle();
  return data ?? null;
}

async function fetchPayment(admin: Admin, paymentId: string) {
  const { data, error } = await admin
    .from("payments")
    .select("amount_original, amount_usd, currency, po_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) { console.error("fetchPayment error", error); return null; }
  if (!data) return null;

  const { data: po } = data.po_id
    ? await admin.from("purchase_orders").select("po_number, supplier").eq("id", data.po_id).maybeSingle()
    : { data: null };

  return {
    amount_original: data.amount_original,
    amount_usd: data.amount_usd,
    currency: data.currency,
    po_number: po?.po_number ?? "PO",
    supplier: po?.supplier ?? null,
  };
}

async function fetchClaim(admin: Admin, claimId: string) {
  const { data, error } = await admin
    .from("inventory_claims")
    .select("qty_claimed, claimed_by, inventory_item_id")
    .eq("id", claimId)
    .maybeSingle();
  if (error) { console.error("fetchClaim error", error); return null; }
  if (!data) return null;

  const [{ data: item }, { data: profile }] = await Promise.all([
    data.inventory_item_id
      ? admin.from("inventory_items").select("name, sku").eq("id", data.inventory_item_id).maybeSingle()
      : Promise.resolve({ data: null }),
    data.claimed_by
      ? admin.from("profiles").select("full_name").eq("id", data.claimed_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    qty_claimed: data.qty_claimed,
    claimer_id: data.claimed_by,
    claimer: profile?.full_name ?? "Unknown",
    item_name: item?.name ?? "Unknown item",
    sku: item?.sku ?? "—",
  };
}

async function fetchStockRequest(admin: Admin, requestId: string) {
  const { data, error } = await admin
    .from("stock_requests")
    .select("qty, priority, department, requester_id, inventory_item_id, note")
    .eq("id", requestId)
    .maybeSingle();
  if (error) { console.error("fetchStockRequest error", error); return null; }
  if (!data) return null;

  const [{ data: item }, { data: profile }] = await Promise.all([
    admin.from("inventory_items").select("name, sku").eq("id", data.inventory_item_id).maybeSingle(),
    admin.from("profiles").select("full_name").eq("id", data.requester_id).maybeSingle(),
  ]);

  return {
    qty: data.qty,
    priority: data.priority,
    department: data.department,
    note: (data as unknown as { note?: string | null }).note ?? null,
    item_name: item?.name ?? "Unknown item",
    sku: item?.sku ?? "—",
    requester: profile?.full_name ?? "Unknown",
  };
}

async function requesterOfPr(admin: Admin, prId: string): Promise<string | null> {
  const { data } = await admin.from("purchase_requests").select("requester_id").eq("id", prId).maybeSingle();
  return data?.requester_id ?? null;
}

async function claimerOf(admin: Admin, claimId: string): Promise<string | null> {
  const { data } = await admin.from("inventory_claims").select("claimed_by").eq("id", claimId).maybeSingle();
  return data?.claimed_by ?? null;
}
