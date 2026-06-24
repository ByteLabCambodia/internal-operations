import { z } from "zod";

export const setRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["employee", "manager", "finance", "admin"]),
});

export const setActiveSchema = z.object({
  user_id: z.string().uuid(),
  active: z.boolean(),
});

export const linkTelegramSchema = z.object({
  user_id: z.string().uuid(),
  telegram_id: z.coerce.number().int().positive().nullable(),
  telegram_username: z.string().optional().nullable(),
});

export const nameSchema = z.object({ name: z.string().min(1, "Required") });

export const toggleSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});
