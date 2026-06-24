"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  nameSchema,
} from "@/features/admin/schemas";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/**
 * Create a user (admin only). Creates the auth user via the admin API (the
 * handle_new_user trigger seeds the profile), then sets the chosen role. The
 * user signs in via magic link — no password is set here.
 */
export async function createUser(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { full_name, email, role } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) return { ok: false, error: error.message };

  const { error: pErr } = await admin
    .from("profiles")
    .update({ full_name, role })
    .eq("id", data.user.id);
  if (pErr) return { ok: false, error: pErr.message };

  revalidatePath("/admin");
  return { ok: true, id: data.user.id };
}

/** Edit a user (admin only): name, email, role, active, optional Telegram id. */
export async function updateUser(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { user_id, full_name, email, role, active, telegram_id } = parsed.data;

  const admin = createAdminClient();

  // Update email in auth.users only if it changed.
  const { data: current } = await admin.auth.admin.getUserById(user_id);
  if (current.user && current.user.email !== email) {
    const { error } = await admin.auth.admin.updateUserById(user_id, { email, email_confirm: true });
    if (error) return { ok: false, error: error.message };
  }

  const { error: pErr } = await admin
    .from("profiles")
    .update({ full_name, role, active, telegram_id: telegram_id ?? null })
    .eq("id", user_id);
  if (pErr) return { ok: false, error: pErr.message };

  revalidatePath("/admin");
  return { ok: true, id: user_id };
}

/** Delete a user (admin only). Cascades to the profile via FK. */
export async function deleteUser(raw: unknown): Promise<Result> {
  const me = await requirePermission("users.manage");
  const parsed = deleteUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (parsed.data.user_id === me.id) {
    return { ok: false, error: "You can't delete your own account" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(parsed.data.user_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

// --- departments / projects ------------------------------------------------

export async function createDepartment(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = nameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({ name: parsed.data.name });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function createProject(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = nameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({ name: parsed.data.name });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
