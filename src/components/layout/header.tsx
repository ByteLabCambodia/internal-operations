"use client";

import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { UserRole } from "@/lib/roles";

export function Header({
  name,
  role,
  telegramLinked,
  onToggleSidebar,
}: {
  name: string;
  role: UserRole;
  telegramLinked: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      {/* Mobile: hamburger opens the nav drawer */}
      <MobileNav role={role} />
      {/* Desktop: collapse/expand the sidebar */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-5" />
      </Button>
      <div className="flex-1" />
      <UserMenu name={name} role={role} telegramLinked={telegramLinked} />
    </header>
  );
}
