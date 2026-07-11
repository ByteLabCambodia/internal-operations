"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, PowerOff, Power, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  renameDepartment, toggleDepartment, deleteDepartment,
  renameProject, toggleProject, deleteProject,
  createDepartment, createProject,
} from "@/features/admin/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/reui/badge";

type OrgItem = { id: string; name: string; active: boolean };
type Kind = "department" | "project";

function OrgRow({ item, kind, onDone }: { item: OrgItem; kind: Kind; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);

  const rename = kind === "department" ? renameDepartment : renameProject;
  const toggle = kind === "department" ? toggleDepartment : toggleProject;
  const remove = kind === "department" ? deleteDepartment : deleteProject;

  async function saveRename() {
    if (name.trim() === item.name) { setEditing(false); return; }
    setBusy(true);
    const res = await rename({ id: item.id, name: name.trim() });
    setBusy(false);
    if (res.ok) { toast.success("Renamed"); setEditing(false); onDone(); }
    else { toast.error(res.error); }
  }

  async function toggleActive() {
    setBusy(true);
    const res = await toggle({ id: item.id, active: !item.active });
    setBusy(false);
    if (res.ok) { toast.success(item.active ? "Deactivated" : "Activated"); onDone(); }
    else { toast.error(res.error); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await remove({ id: item.id });
    setBusy(false);
    if (res.ok) { toast.success("Deleted"); onDone(); }
    else { toast.error(res.error); } // surfaces "In use — deactivate instead" if FK blocked
  }

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      {editing ? (
        <>
          <Input
            autoFocus
            className="h-7 flex-1 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditing(false); }}
          />
          <Button size="icon" variant="ghost" className="size-7" onClick={saveRename} disabled={busy}>
            <Check className="size-3.5 text-emerald-600" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7" onClick={() => { setEditing(false); setName(item.name); }}>
            <X className="size-3.5" />
          </Button>
        </>
      ) : (
        <>
          <span className={`flex-1 text-sm ${!item.active ? "text-muted-foreground line-through" : ""}`}>
            {item.name}
          </span>
          {!item.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
          <Button size="icon" variant="ghost" className="size-7" title="Rename" onClick={() => setEditing(true)} disabled={busy}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            title={item.active ? "Deactivate" : "Activate"}
            onClick={toggleActive}
            disabled={busy}
          >
            {item.active
              ? <PowerOff className="size-3.5 text-muted-foreground" />
              : <Power className="size-3.5 text-emerald-600" />}
          </Button>
          <Button size="icon" variant="ghost" className="size-7" title="Delete" onClick={handleDelete} disabled={busy}>
            <Trash2 className="size-3.5 text-red-500" />
          </Button>
        </>
      )}
    </div>
  );
}

export function OrgList({ kind, items }: { kind: Kind; items: OrgItem[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = kind === "department" ? createDepartment : createProject;

  async function add() {
    if (!newName.trim()) return;
    setBusy(true);
    const res = await create({ name: newName.trim() });
    setBusy(false);
    if (res.ok) { toast.success(`${kind} added`); setNewName(""); router.refresh(); }
    else { toast.error(res.error); }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={`New ${kind}`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={add} disabled={busy || !newName.trim()}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      <div className="space-y-1">
        {items.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No {kind}s yet.</p>
        )}
        {items.map((item) => (
          <OrgRow key={item.id} item={item} kind={kind} onDone={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}
