import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { can, type Permission, type UserRole } from "@/lib/roles";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Current authenticated user, or null. Always validates server-side. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Current user's profile (role, name, telegram link), or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
}

/** Require an authenticated user with a profile; redirect to /login otherwise. */
export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * App-layer permission gate (defense in depth on top of RLS). Throws if the
 * current user's role lacks the permission. Use inside server actions.
 */
export async function requirePermission(permission: Permission): Promise<Profile> {
  const profile = await requireUser();
  if (!profile.active || !can(profile.role as UserRole, permission)) {
    throw new Error(`Forbidden: ${permission} requires a different role`);
  }
  return profile;
}
