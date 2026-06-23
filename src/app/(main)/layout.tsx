import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { requireUser } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireUser();
  const role = profile.role as UserRole;

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header name={profile.full_name ?? "User"} role={role} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
