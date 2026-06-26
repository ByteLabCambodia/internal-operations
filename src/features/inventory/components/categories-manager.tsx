"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/features/inventory/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Category = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
};

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  async function add() {
    setBusy(true);
    const res = await createCategory({ name, description: description || undefined });
    setBusy(false);
    if (res.ok) {
      toast.success("Category created");
      setName("");
      setDescription("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  function startEdit(c: Category) {
    setEditing(c.id);
    setEditName(c.name);
    setEditDesc(c.description ?? "");
  }

  async function saveEdit(id: string) {
    setBusy(true);
    const res = await updateCategory({ id, name: editName, description: editDesc || undefined });
    setBusy(false);
    if (res.ok) {
      toast.success("Category updated");
      setEditing(null);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    setBusy(true);
    const res = await deleteCategory({ id: c.id });
    setBusy(false);
    if (res.ok) {
      toast.success("Category deleted");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New category</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Electronics" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={add} disabled={busy || !name}>
              <Plus className="size-4" /> Add category
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => {
              const isEditing = editing === c.id;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      c.name
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {isEditing ? (
                      <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                    ) : (
                      c.description || "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.itemCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Save"
                            onClick={() => saveEdit(c.id)}
                            disabled={busy || !editName}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Cancel" onClick={() => setEditing(null)}>
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" title="Edit" onClick={() => startEdit(c)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Delete" onClick={() => remove(c)} disabled={busy}>
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
