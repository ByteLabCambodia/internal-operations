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
  renameSchema,
  toggleActiveSchema,
  idSchema,
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
  const { full_name, email, role, password } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
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
  const { user_id, full_name, email, role, active, telegram_id, new_password } = parsed.data;

  const admin = createAdminClient();

  // Update email and/or password in auth.users if changed.
  const { data: current } = await admin.auth.admin.getUserById(user_id);
  const authUpdate: { email?: string; email_confirm?: boolean; password?: string } = {};
  if (current.user && current.user.email !== email) {
    authUpdate.email = email;
    authUpdate.email_confirm = true;
  }
  if (new_password) authUpdate.password = new_password;
  if (Object.keys(authUpdate).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(user_id, authUpdate);
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

export async function renameDepartment(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = renameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ name: parsed.data.name }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleDepartment(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = toggleActiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ active: parsed.data.active }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteDepartment(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", parsed.data.id);
  if (error) {
    // FK violation = still referenced by PRs/POs/journals — must deactivate instead
    if (error.code === "23503") return { ok: false, error: "In use — deactivate instead of deleting" };
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function renameProject(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = renameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ name: parsed.data.name }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteProject(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", parsed.data.id);
  if (error) {
    if (error.code === "23503") return { ok: false, error: "In use — deactivate instead of deleting" };
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleProject(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = toggleActiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ active: parsed.data.active }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
