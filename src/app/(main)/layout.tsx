import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireUser();

  return (
    <AppShell role={profile.role as UserRole} name={profile.full_name ?? "User"} telegramLinked={Boolean(profile.telegram_id)}>
      {children}
    </AppShell>
  );
}
