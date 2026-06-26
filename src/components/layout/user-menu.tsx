"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronsUpDown, ExternalLink, LogOut, Monitor, Moon, Send, Sun } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

export function UserMenu({ name, role, telegramLinked }: { name: string; role: UserRole; telegramLinked: boolean }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [linking, setLinking] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function linkTelegram() {
    setLinking(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const body = await res.json();
      if (res.ok && body.url) {
        window.open(body.url, "_blank", "noopener");
      }
    } finally {
      setLinking(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-10 gap-2 px-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initials(name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-tight font-medium">{name}</span>
              <span className="block text-xs leading-tight text-muted-foreground capitalize">{role}</span>
            </span>
            <ChevronsUpDown className="hidden size-4 text-muted-foreground sm:block" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <span className="block text-sm font-medium">{name}</span>
          <span className="block text-xs text-muted-foreground capitalize">{role}</span>
        </div>
        <DropdownMenuSeparator />

        {telegramLinked ? (
          <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
            <Send className="size-4" />
            Telegram linked ✓
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={linkTelegram} disabled={linking} className="gap-2">
            <ExternalLink className="size-4" />
            {linking ? "Opening…" : "Link Telegram account"}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => v && setTheme(v)}>
              <DropdownMenuRadioItem value="light">
                <Sun className="size-4" /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="size-4" /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="size-4" /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className={cn("text-destructive focus:text-destructive")}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
