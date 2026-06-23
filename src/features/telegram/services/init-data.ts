import { createHmac } from "node:crypto";

/**
 * Validation of Telegram Mini App `initData`.
 *
 * Per Telegram's spec the client sends a urlencoded `initData` string. We:
 *  1. split out the `hash` field,
 *  2. build a sorted `key=value` data-check-string of the rest,
 *  3. derive secret = HMAC_SHA256("WebAppData", bot_token),
 *  4. compare HMAC_SHA256(secret, data-check-string) to `hash`.
 * We also reject stale data via `auth_date`.
 */

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidatedInitData {
  user: TelegramUser;
  authDate: number;
  raw: URLSearchParams;
}

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS,
): ValidatedInitData {
  if (!botToken) throw new Error("bot token not configured");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("initData missing hash");

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (computed !== hash) {
    throw new Error("initData signature invalid");
  }

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) {
    throw new Error("initData expired");
  }

  const userJson = params.get("user");
  if (!userJson) throw new Error("initData missing user");
  const user = JSON.parse(userJson) as TelegramUser;

  return { user, authDate, raw: params };
}
