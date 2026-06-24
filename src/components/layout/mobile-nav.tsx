"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "@/components/layout/nav-links";
import type { UserRole } from "@/lib/roles";

/** Hamburger menu that opens the navigation in a slide-out drawer on mobile. */
export function MobileNav({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 gap-0 p-0">
        <SheetHeader className="h-14 justify-center border-b px-4">
          <SheetTitle className="text-left font-semibold tracking-tight">ByteLab Ops</SheetTitle>
        </SheetHeader>
        <NavLinks role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
