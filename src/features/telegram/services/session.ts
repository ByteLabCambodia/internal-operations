import { createClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mints a *real* Supabase session for a Mini App user that has been
 * authenticated via Telegram initData.
 *
 * The project signs JWTs with an asymmetric (ES256) key whose private half
 * Supabase never exposes, so we cannot hand-sign a token GoTrue will accept.
 * Instead we ask GoTrue to issue one: generate a one-time magic-link token for
 * the user (Admin API, service-role key) and immediately redeem it via
 * `verifyOtp`. The returned access token is signed by GoTrue itself, so
 * `auth.getUser()` validates it and RLS applies normally. We also return the
 * refresh token so the client can renew without re-running the initData
 * exchange.
 *
 * `generateLink` does not send any email — it only mints the token.
 */
export async function createUserSession(opts: {
  email: string;
}): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  if (!opts.email) {
    throw new Error("user has no email; cannot mint a session");
  }

  const admin = createAdminClient();
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: opts.email,
  });
  if (linkError || !link.properties?.hashed_token) {
    throw new Error(linkError?.message ?? "failed to generate session token");
  }

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError || !verified.session) {
    throw new Error(verifyError?.message ?? "failed to redeem session token");
  }

  return {
    accessToken: verified.session.access_token,
    refreshToken: verified.session.refresh_token,
    expiresIn: verified.session.expires_in ?? 3600,
  };
}
