import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Privileged Supabase client using the service-role key. BYPASSES RLS.
 *
 * Server-only. Never import this into client components or expose the key.
 * Use exclusively for trusted server flows: the Telegram init-data session
 * bridge, webhook handlers, and the FX cron job.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
