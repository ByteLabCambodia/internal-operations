/**
 * Role definitions and the permission matrix from the brief (§3).
 *
 * Permissions are enforced in BOTH Supabase RLS (DB layer) and server actions
 * (app layer). This module is the single source for the app-layer checks so
 * they stay consistent with the policy intent.
 */

export type UserRole = "employee" | "manager" | "finance" | "admin";

export type Permission =
  | "pr.create"
  | "pr.decide" // approve / reject
  | "po.create"
  | "payment.record"
  | "claim.submit"
  | "claim.confirm"
  | "stock.request"
  | "stock.fulfil"
  | "accounting.view"
  | "income.add"
  | "rate.override"
  | "users.manage";

const MATRIX: Record<Permission, UserRole[]> = {
  "pr.create": ["employee", "manager", "finance", "admin"],
  "pr.decide": ["manager", "admin"],
  "po.create": ["manager", "finance", "admin"],
  "payment.record": ["finance", "admin"],
  "claim.submit": ["employee", "manager", "finance", "admin"],
  "claim.confirm": ["manager", "admin"],
  "stock.request": ["employee", "manager", "finance", "admin"],
  "stock.fulfil": ["manager", "admin"],
  "accounting.view": ["manager", "finance", "admin"],
  "income.add": ["finance", "admin"],
  "rate.override": ["finance", "admin"],
  "users.manage": ["admin"],
};

/** Whether a role is allowed to perform an action. */
export function can(role: UserRole, permission: Permission): boolean {
  return MATRIX[permission].includes(role);
}
