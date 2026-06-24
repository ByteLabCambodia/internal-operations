import { UserMenu } from "@/components/layout/user-menu";
import type { UserRole } from "@/lib/roles";

export function Header({ name, role }: { name: string; role: UserRole }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="text-sm font-medium md:hidden">ByteLab Ops</div>
      <div className="flex-1" />
      <UserMenu name={name} role={role} />
    </header>
  );
}
