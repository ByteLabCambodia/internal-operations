import { z } from "zod";

const roleEnum = z.enum(["employee", "manager", "finance", "admin"]);

export const createUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  role: roleEnum,
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  role: roleEnum,
  active: z.boolean(),
  telegram_id: z.coerce.number().int().positive().nullable().optional(),
  new_password: z.string().min(8, "Password must be at least 8 characters").or(z.literal("")).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const deleteUserSchema = z.object({ user_id: z.string().uuid() });

export const nameSchema = z.object({ name: z.string().min(1, "Required") });

export const renameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Required"),
});

export const toggleActiveSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

export const idSchema = z.object({ id: z.string().uuid() });
