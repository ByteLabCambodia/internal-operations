"use server";

import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Verify the recovery token and set the new password in a single request.
 *
 * Verifying and updating in the same action means the Supabase client holds the
 * recovery session in memory — we never depend on a session cookie surviving the
 * redirect round-trip, which is unreliable on local http. The token is only
 * consumed here on submit, so a prefetch of the page can't burn it.
 */
export async function updatePassword(
  tokenHash: string,
  type: EmailOtpType,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!tokenHash) {
    return { ok: false, error: "Invalid reset link. Request a new one." };
  }

  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (verifyError) {
    return {
      ok: false,
      error: "Your reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
