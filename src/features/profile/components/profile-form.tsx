"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send } from "lucide-react";
import { toast } from "sonner";

import { updateProfile, updatePassword, unlinkTelegram } from "@/features/profile/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/reui/badge";

type Props = {
  fullName: string | null;
  department: string | null;
  email: string;
  telegramLinked: boolean;
  botUsername: string | null;
};

// ── Personal info ─────────────────────────────────────────────────────────────

function PersonalInfoSection({ fullName, department, email }: Pick<Props, "fullName" | "department" | "email">) {
  const [name, setName] = useState(fullName ?? "");
  const [dept, setDept] = useState(department ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await updateProfile({ full_name: name, department: dept || undefined });
    setBusy(false);
    if (res.ok) toast.success("Profile updated");
    else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Personal information</h2>
        <p className="text-sm text-muted-foreground">Update your display name and department.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="bg-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="department">Department</Label>
          <Input id="department" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="e.g. Engineering" />
        </div>
      </div>
      <Button onClick={save} disabled={busy || !name.trim()}>
        {busy ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

// ── Password ──────────────────────────────────────────────────────────────────

function PasswordSection() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await updatePassword({ password, confirm });
    setBusy(false);
    if (res.ok) {
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
    } else {
      toast.error(res.error);
    }
  }

  const valid = password.length >= 8 && password === confirm;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Change password</h2>
        <p className="text-sm text-muted-foreground">Must be at least 8 characters.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {confirm && !valid && password !== confirm && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
      </div>
      <Button onClick={save} disabled={busy || !valid}>
        {busy ? "Updating…" : "Update password"}
      </Button>
    </div>
  );
}

// ── Telegram ──────────────────────────────────────────────────────────────────

type TgState = "idle" | "loading" | "ready";

function TelegramSection({ telegramLinked, botUsername }: Pick<Props, "telegramLinked" | "botUsername">) {
  const router = useRouter();
  const [tgState, setTgState] = useState<TgState>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  async function generateCode() {
    setTgState("loading");
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const body = await res.json();
      if (res.ok && body.code) {
        setCode(body.code);
        setTgState("ready");
      } else {
        setTgState("idle");
        toast.error("Failed to generate code");
      }
    } catch {
      setTgState("idle");
    }
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function unlink() {
    setUnlinking(true);
    const res = await unlinkTelegram();
    setUnlinking(false);
    if (res.ok) {
      toast.success("Telegram unlinked");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Telegram</h2>
        <p className="text-sm text-muted-foreground">
          Link your Telegram account to receive notifications and use the Mini App.
        </p>
      </div>

      {telegramLinked ? (
        <div className="flex items-center gap-3">
          <Badge variant="success-light" className="gap-1.5">
            <Send className="size-3" />
            Linked
          </Badge>
          <Button variant="outline" size="sm" onClick={unlink} disabled={unlinking}>
            {unlinking ? "Unlinking…" : "Unlink"}
          </Button>
        </div>
      ) : tgState === "idle" ? (
        <Button variant="outline" onClick={generateCode}>
          <Send className="size-4" />
          Link Telegram account
        </Button>
      ) : tgState === "loading" ? (
        <p className="text-sm text-muted-foreground">Generating code…</p>
      ) : (
        <div className="max-w-sm space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Open <strong>@{botUsername ?? "the bot"}</strong> in Telegram and send this code:
          </p>
          <div className="flex items-center gap-2">
            <span className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-xl font-bold tracking-widest">
              {code}
            </span>
            <Button variant="outline" size="icon" onClick={copyCode} title="Copy">
              {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
            </Button>
          </div>
          {botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
            >
              <Send className="size-3.5" />
              Open @{botUsername}
            </a>
          )}
          <p className="text-xs text-muted-foreground">Code expires in 15 minutes.</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => { setTgState("idle"); setCode(null); router.refresh(); }}
          >
            Done — refresh status
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function ProfileForm({ fullName, department, email, telegramLinked, botUsername }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PersonalInfoSection fullName={fullName} department={department} email={email} />
      <Separator />
      <PasswordSection />
      <Separator />
      <TelegramSection telegramLinked={telegramLinked} botUsername={botUsername} />
    </div>
  );
}
