import { Bot } from "grammy";

/**
 * Telegram integration. Business logic NEVER calls the Bot API directly —
 * it goes through `notify(event, payload)`. A dispatcher resolves each event
 * to a destination (group forum topic or personal DM) per the routing table
 * in the brief. Full dispatch + inline-button flows land in Phase 5; this is
 * the Phase 0 shell.
 */

let _bot: Bot | null = null;

/** Lazily-constructed grammY bot. Server-only; requires the bot token. */
export function getBot(): Bot {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  _bot = new Bot(token);
  return _bot;
}

/** Domain events that can trigger a notification (see brief §6 routing table). */
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

/**
 * Enqueue/dispatch a notification for a domain event. In Phase 5 this writes a
 * `notifications` row and dispatches via the bot (DM or group topic). For now
 * it is a no-op stub so business logic can call it safely.
 */
export async function notify(event: NotifyEvent, payload: NotifyPayload): Promise<void> {
  void event;
  void payload;
  // TODO(Phase 5): persist notification + dispatch to Telegram.
}
