import { z } from "zod";

const roleEnum = z.enum(["employee", "manager", "finance", "admin"]);

export const createUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  role: roleEnum,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  role: roleEnum,
  active: z.boolean(),
  telegram_id: z.coerce.number().int().positive().nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const deleteUserSchema = z.object({ user_id: z.string().uuid() });

export const nameSchema = z.object({ name: z.string().min(1, "Required") });
