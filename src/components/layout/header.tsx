import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="text-sm font-medium md:hidden">ByteLab Ops</div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Badge variant="secondary">Phase 0 — scaffold</Badge>
      </div>
    </header>
  );
}
