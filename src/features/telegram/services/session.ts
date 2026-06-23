import { SignJWT } from "jose";

/**
 * Mints a Supabase-compatible access token (HS256, signed with the project JWT
 * secret) for a Mini App user that has been authenticated via Telegram
 * initData. The Mini App uses this as a Bearer token so RLS applies normally;
 * on expiry it re-runs the initData exchange (Telegram supplies fresh initData
 * on each launch), so no refresh token is needed.
 */
export async function mintAccessToken(opts: {
  userId: string;
  email?: string | null;
  ttlSeconds?: number;
}): Promise<{ accessToken: string; expiresIn: number }> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error("SUPABASE_JWT_SECRET not configured");

  const ttl = opts.ttlSeconds ?? 60 * 60; // 1h
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await new SignJWT({
    role: "authenticated",
    email: opts.email ?? undefined,
    app_metadata: { provider: "telegram", providers: ["telegram"] },
    user_metadata: {},
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(opts.userId)
    .setAudience("authenticated")
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .sign(new TextEncoder().encode(secret));

  return { accessToken, expiresIn: ttl };
}
