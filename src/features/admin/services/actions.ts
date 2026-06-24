"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import {
  setRoleSchema,
  setActiveSchema,
  linkTelegramSchema,
  nameSchema,
  toggleSchema,
} from "@/features/admin/schemas";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/** Change a user's role (admin only). RLS + the role-guard trigger also apply. */
export async function setUserRole(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = setRoleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.user_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

/** Activate / deactivate a user (admin only). */
export async function setUserActive(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = setActiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.user_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

/** Link (or clear) a user's Telegram identity (admin only). */
export async function linkTelegram(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = linkTelegramSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      telegram_id: parsed.data.telegram_id,
      telegram_username: parsed.data.telegram_username ?? null,
    })
    .eq("id", parsed.data.user_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

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

export async function setDepartmentActive(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = toggleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ active: parsed.data.active }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function setProjectActive(raw: unknown): Promise<Result> {
  await requirePermission("users.manage");
  const parsed = toggleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ active: parsed.data.active }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
