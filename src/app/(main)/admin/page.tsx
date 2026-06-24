import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRow, type AdminUser } from "@/features/admin/components/user-row";
import { AddNameForm } from "@/features/admin/components/add-name-form";

export default async function AdminPage() {
  await requirePermission("users.manage");
  const supabase = await createClient();

  const [{ data: users }, { data: departments }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, active, telegram_id").order("full_name"),
    supabase.from("departments").select("id, name, active").order("name"),
    supabase.from("projects").select("id, name, active").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Users, roles, departments, and projects.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <UserRow key={u.id} user={{ ...u, role: u.role as UserRole } as AdminUser} />
              ))}
            </TableBody>
          </Table>
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
