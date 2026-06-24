import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersManager, type AdminUser } from "@/features/admin/components/users-manager";
import { AddNameForm } from "@/features/admin/components/add-name-form";

export default async function AdminPage() {
  const me = await requirePermission("users.manage");
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles }, authList, { data: departments }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, active, telegram_id").order("full_name"),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabase.from("departments").select("id, name, active").order("name"),
    supabase.from("projects").select("id, name, active").order("name"),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Users, roles, departments, and projects.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <UsersManager users={users} currentUserId={me.id} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Departments</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <AddNameForm kind="department" />
            <div className="flex flex-wrap gap-2">
              {(departments ?? []).map((d) => (
                <Badge key={d.id} variant={d.active ? "secondary" : "outline"}>{d.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <AddNameForm kind="project" />
            <div className="flex flex-wrap gap-2">
              {(projects ?? []).map((p) => (
                <Badge key={p.id} variant={p.active ? "secondary" : "outline"}>{p.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
