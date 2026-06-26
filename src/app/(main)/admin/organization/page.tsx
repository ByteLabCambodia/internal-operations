import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgList } from "@/features/admin/components/org-list";

export default async function AdminOrganizationPage() {
  await requirePermission("users.manage");
  const supabase = await createClient();

  const [{ data: departments }, { data: projects }] = await Promise.all([
    supabase.from("departments").select("id, name, active").order("name"),
    supabase.from("projects").select("id, name, active").order("name"),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Departments</CardTitle></CardHeader>
        <CardContent>
          <OrgList kind="department" items={departments ?? []} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
        <CardContent>
          <OrgList kind="project" items={projects ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
