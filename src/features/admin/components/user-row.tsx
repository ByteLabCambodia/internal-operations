"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setUserRole, setUserActive, linkTelegram } from "@/features/admin/services/actions";
import type { UserRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdminUser = {
  id: string;
  full_name: string | null;
  role: UserRole;
  active: boolean;
  telegram_id: number | null;
};

export function UserRow({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [tg, setTg] = useState(user.telegram_id ? String(user.telegram_id) : "");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      toast.success(msg);
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
  }

  return (
    <TableRow className={user.active ? "" : "opacity-50"}>
      <TableCell>{user.full_name ?? "—"}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(v) => v && run(() => setUserRole({ user_id: user.id, role: v as UserRole }), "Role updated")}
        >
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">employee</SelectItem>
            <SelectItem value="manager">manager</SelectItem>
            <SelectItem value="finance">finance</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Input
            className="w-32"
            placeholder="Telegram ID"
            value={tg}
            onChange={(e) => setTg(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(
                () => linkTelegram({ user_id: user.id, telegram_id: tg ? Number(tg) : null }),
                "Telegram link saved",
              )
            }
          >
            Link
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant={user.active ? "outline" : "default"}
          disabled={busy}
          onClick={() => run(() => setUserActive({ user_id: user.id, active: !user.active }), "Updated")}
        >
          {user.active ? "Deactivate" : "Activate"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
