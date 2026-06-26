"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateUser, deleteUser } from "@/features/admin/services/actions";
import type { UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  active: boolean;
  telegram_id: number | null;
};

const ROLES: UserRole[] = ["employee", "manager", "finance", "admin"];

type DialogState = { mode: "edit"; user: AdminUser } | null;

export function UsersManager({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);

  async function remove(user: AdminUser) {
    if (!confirm(`Delete ${user.full_name ?? user.email}? This cannot be undone.`)) return;
    const res = await deleteUser({ user_id: user.id });
    if (res.ok) {
      toast.success("User deleted");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className={u.active ? "" : "opacity-60"}>
              <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
              <TableCell><Badge variant="secondary" className="capitalize">{u.role}</Badge></TableCell>
              <TableCell>
                <Badge variant={u.active ? "default" : "outline"}>{u.active ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setDialog({ mode: "edit", user: u })}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete"
                    disabled={u.id === currentUserId}
                    onClick={() => remove(u)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        {dialog && <UserForm user={dialog.user} onDone={() => { setDialog(null); router.refresh(); }} />}
      </Dialog>
    </div>
  );
}

function UserForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user.role);
  const [active, setActive] = useState(user.active);
  const [telegramId, setTelegramId] = useState(user.telegram_id ? String(user.telegram_id) : "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await updateUser({
      user_id: user.id,
      full_name: fullName,
      email,
      role,
      active,
      telegram_id: telegramId ? Number(telegramId) : null,
      new_password: password || undefined,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("User updated");
      onDone();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit user</DialogTitle>
        <DialogDescription>Update this user's details.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@bytelab.dev" />
        </div>
        <div className="space-y-2">
          <Label>New password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole((v ?? "employee") as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={active ? "active" : "inactive"} onValueChange={(v) => setActive(v === "active")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Telegram ID (optional)</Label>
          <Input value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="e.g. 123456789" />
        </div>
      </div>

      <DialogFooter>
        <Button onClick={submit} disabled={busy || !fullName || !email}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
