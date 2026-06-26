"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check, ChevronsUpDown, Copy, LogOut, Monitor, Moon, Send, Sun, User } from "lucide-react";

import Link from "next/link";

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

type LinkState = "idle" | "loading" | "ready";

export function UserMenu({ name, role, telegramLinked }: { name: string; role: UserRole; telegramLinked: boolean }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function generateCode() {
    setLinkState("loading");
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const body = await res.json();
      if (res.ok && body.code) {
        setCode(body.code);
        setBotUsername(body.botUsername ?? null);
        setLinkState("ready");
      } else {
        setLinkState("idle");
      }
    } catch {
      setLinkState("idle");
    }
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) { setLinkState("idle"); setCode(null); } }}>
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
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <span className="block text-sm font-medium">{name}</span>
          <span className="block text-xs text-muted-foreground capitalize">{role}</span>
        </div>
        <DropdownMenuItem render={<Link href="/profile" />} className="gap-2">
          <User className="size-4" />
          Profile & settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {telegramLinked ? (
          <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
            <Send className="size-4 shrink-0" />
            Telegram linked ✓
          </DropdownMenuItem>
        ) : linkState === "idle" ? (
          <DropdownMenuItem onClick={generateCode} className="gap-2">
            <Send className="size-4 shrink-0" />
            Link Telegram account
          </DropdownMenuItem>
        ) : linkState === "loading" ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">Generating code…</div>
        ) : (
          <div className="space-y-2 px-2 py-2">
            <p className="text-xs text-muted-foreground leading-snug">
              Open <strong>@{botUsername ?? "the bot"}</strong> in Telegram and send this code:
            </p>
            <div className="flex items-center gap-1.5">
              <span className="flex-1 rounded-md border bg-muted px-3 py-1.5 font-mono text-base font-semibold tracking-widest">
                {code}
              </span>
              <button
                onClick={copyCode}
                className="flex size-8 items-center justify-center rounded-md border hover:bg-accent"
                title="Copy code"
              >
                {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            {botUsername && (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-primary underline underline-offset-2"
              >
                Open @{botUsername} →
              </a>
            )}
            <button
              onClick={() => { setLinkState("idle"); setCode(null); router.refresh(); }}
              className="w-full text-center text-xs text-muted-foreground underline underline-offset-2"
            >
              Done — refresh
            </button>
          </div>
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
