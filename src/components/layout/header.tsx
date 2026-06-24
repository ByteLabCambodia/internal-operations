import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { UserRole } from "@/lib/roles";

export function Header({ name, role }: { name: string; role: UserRole }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="text-sm font-medium md:hidden">ByteLab Ops</div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
        <Badge variant="secondary" className="capitalize">
          {role}
        </Badge>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
