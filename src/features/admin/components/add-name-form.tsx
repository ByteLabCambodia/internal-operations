"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createDepartment, createProject } from "@/features/admin/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddNameForm({ kind }: { kind: "department" | "project" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const fn = kind === "department" ? createDepartment : createProject;
    const res = await fn({ name });
    setBusy(false);
    if (res.ok) {
      toast.success(`${kind} added`);
      setName("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex gap-2">
      <Input placeholder={`New ${kind}`} value={name} onChange={(e) => setName(e.target.value)} />
      <Button onClick={submit} disabled={busy || !name}>
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}
