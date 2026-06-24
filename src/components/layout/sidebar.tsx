import { cn } from "@/lib/utils";
import { NavLinks } from "@/components/layout/nav-links";
import type { UserRole } from "@/lib/roles";

export function Sidebar({ role, open }: { role: UserRole; open: boolean }) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 overflow-hidden border-r bg-sidebar transition-[width] duration-200 ease-in-out md:block",
        open ? "md:w-60" : "md:w-0 md:border-r-0",
      )}
    >
      {/* Fixed-width inner content so it slides under the clip instead of reflowing. */}
      <div className="flex h-full w-60 flex-col">
        <div className="flex h-14 items-center border-b px-4 font-semibold tracking-tight">
          ByteLab Ops
        </div>
        <NavLinks role={role} />
      </div>
    </aside>
  );
}
