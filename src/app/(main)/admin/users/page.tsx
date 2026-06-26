import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersManager, type AdminUser } from "@/features/admin/components/users-manager";
import { NewUserButton } from "@/features/admin/components/new-user-button";

export default async function AdminUsersPage() {
  const me = await requirePermission("users.manage");
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles }, authList] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, active, telegram_id").order("full_name"),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const emailById = new Map((authList.data?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const users: AdminUser[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById.get(p.id) ?? null,
    role: p.role as UserRole,
    active: p.active,
    telegram_id: p.telegram_id,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Users</CardTitle>
        <NewUserButton />
      </CardHeader>
      <CardContent>
        <UsersManager users={users} currentUserId={me.id} />
      </CardContent>
    </Card>
  );
}
