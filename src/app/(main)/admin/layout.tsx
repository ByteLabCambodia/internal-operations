import { requirePermission } from "@/lib/auth";
import { AdminTabs } from "./admin-tabs";

/** Admin section shell: guards every /admin/* route once and renders the tabs. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("users.manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage users, organization master data, and system settings.
        </p>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
