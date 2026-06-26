"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  department: z.string().max(100).optional(),
});

export async function updateProfile(raw: unknown) {
  const profile = await requireUser();
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, department: parsed.data.department ?? null })
    .eq("id", profile.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

export async function updatePassword(raw: unknown) {
  await requireUser();
  const parsed = passwordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unlinkTelegram() {
  const profile = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ telegram_id: null, telegram_link_token: null, telegram_link_expires_at: null })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}
