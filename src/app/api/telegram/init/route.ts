import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validateInitData } from "@/features/telegram/services/init-data";
import { createUserSession } from "@/features/telegram/services/session";

/**
 * Telegram Mini App auth bridge.
 *
 * Validates Telegram `initData` (HMAC against the bot token, rejecting stale or
 * tampered data), maps telegram_id -> profiles, and returns a Supabase-
 * compatible access token so the Mini App can talk to Supabase under RLS.
 *
 * The profile must already be linked to this telegram_id (set during web
 * onboarding / admin). Unlinked users get a clear 403.
 */
export async function POST(request: NextRequest) {
  let initData: string;
  try {
    ({ initData } = await request.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  let validated;
  try {
    validated = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN ?? "");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "invalid initData" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("telegram_id", validated.user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "telegram account not linked to a user" },
      { status: 403 },
    );
  }
  if (!profile.active) {
    return NextResponse.json({ error: "account disabled" }, { status: 403 });
  }

  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  const email = authUser.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: "user account has no email; cannot start session" },
      { status: 409 },
    );
  }

  const { accessToken, refreshToken, expiresIn } = await createUserSession({ email });

  return NextResponse.json({
    accessToken,
    refreshToken,
    expiresIn,
    profile: { id: profile.id, full_name: profile.full_name, role: profile.role },
  });
}
