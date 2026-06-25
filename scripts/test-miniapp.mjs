/**
 * Generates a valid Telegram initData string and hits /api/telegram/init.
 *
 * Usage:
 *   node scripts/test-miniapp.mjs [telegram_user_id]
 *
 * The telegram_user_id must be linked to a profiles row via telegram_id.
 * Run the link helper first if you haven't:
 *   node scripts/test-miniapp.mjs --link <telegram_id> <profile_email>
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Parse .env.local manually — no dotenv dependency needed.
function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(file, "utf8")
        .split("\n")
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const idx = l.indexOf("=");
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const env = loadEnv(resolve(root, ".env.local"));
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || "";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54421";
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is empty in .env.local");
  process.exit(1);
}

// ── helpers ────────────────────────────────────────────────────────────────

function buildInitData(telegramUserId) {
  const user = {
    id: Number(telegramUserId),
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    language_code: "en",
  };

  const authDate = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams({
    auth_date: String(authDate),
    user: JSON.stringify(user),
  });

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hash = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  params.set("hash", hash);

  return params.toString();
}

async function callInit(initData) {
  const res = await fetch(`${APP_URL}/api/telegram/init`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  return { status: res.status, body: await res.json() };
}

async function linkTelegramId(telegramId, profileId) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      prefer: "return=representation",
    },
    body: JSON.stringify({ telegram_id: Number(telegramId) }),
  });
  return { status: res.status, body: await res.json() };
}

async function listProfiles() {
  // Fetch profiles and auth users separately, then join on id.
  const [profilesRes, usersRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,role,telegram_id,active`, {
      headers: { apikey: SERVICE_ROLE_KEY, authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    }),
    fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, {
      headers: { apikey: SERVICE_ROLE_KEY, authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    }),
  ]);
  const profiles = await profilesRes.json();
  const { users = [] } = await usersRes.json();
  const emailById = Object.fromEntries(users.map((u) => [u.id, u.email]));
  return Array.isArray(profiles)
    ? profiles.map((p) => ({ ...p, email: emailById[p.id] ?? "(no auth user)" }))
    : profiles;
}

// ── main ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args[0] === "--list") {
  console.log("Profiles in local DB:");
  const profiles = await listProfiles();
  console.table(profiles.map((p) => ({
    email: p.email,
    name: p.full_name,
    role: p.role,
    telegram_id: p.telegram_id ?? "(not linked)",
    active: p.active,
  })));
  process.exit(0);
}

if (args[0] === "--link") {
  const [, telegramId, profileId] = args;
  if (!telegramId || !profileId) {
    console.error("Usage: node scripts/test-miniapp.mjs --link <telegram_id> <profile_uuid>");
    console.error("       (get the UUID from --list)");
    process.exit(1);
  }
  console.log(`Linking telegram_id=${telegramId} → profile ${profileId} ...`);
  const { status, body } = await linkTelegramId(telegramId, profileId);
  if (status === 200 && body.length) {
    console.log("Linked:", body[0]);
  } else {
    console.error(`Failed (${status}):`, body);
    process.exit(1);
  }
  process.exit(0);
}

// Default: test auth flow with provided or default telegram_id
const telegramId = args[0] || "123456789";
console.log(`\nBuilding initData for Telegram user ${telegramId} (bot token: ${BOT_TOKEN.slice(0, 8)}...)\n`);

const initData = buildInitData(telegramId);
console.log("initData:", initData.slice(0, 80) + "...\n");

const { status, body } = await callInit(initData);
console.log(`POST /api/telegram/init → ${status}`);
console.log(JSON.stringify(body, null, 2));

if (status === 403 && body.error === "telegram account not linked to a user") {
  console.log(`\nHint: link this telegram_id to a profile first:`);
  console.log(`  node scripts/test-miniapp.mjs --list`);
  console.log(`  node scripts/test-miniapp.mjs --link ${telegramId} <profile_uuid>`);
}
