import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { validateInitData } from "@/features/telegram/services/init-data";
import { mintAccessToken } from "@/features/telegram/services/session";

export async function POST(request: NextRequest) {
  let initData: string, email: string, password: string;
  try {
    ({ initData, email, password } = await request.json());
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

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signInData.user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", signInData.user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "user profile not found" }, { status: 404 });
  }
  if (!profile.active) {
    return NextResponse.json({ error: "account disabled" }, { status: 403 });
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ telegram_id: validated.user.id })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { accessToken, expiresIn } = await mintAccessToken({
    userId: profile.id,
    email: signInData.user.email ?? null,
  });

  return NextResponse.json({
    accessToken,
    expiresIn,
    profile: { id: profile.id, full_name: profile.full_name, role: profile.role },
  });
}
