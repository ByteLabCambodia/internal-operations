"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createInventoryItem } from "@/features/inventory/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ItemForm({ categories = [] }: { categories?: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    unit: "pcs",
    reorder_point: "0",
    reorder_qty: "0",
  });
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit() {
    setBusy(true);
    const res = await createInventoryItem({
      sku: form.sku,
      name: form.name,
      category: form.category || undefined,
      unit: form.unit,
      reorder_point: Number(form.reorder_point),
      reorder_qty: Number(form.reorder_qty),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Item created");
      router.push("/inventory");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="MCU-ESP32" />
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          {categories.length > 0 ? (
            <Select value={form.category} onValueChange={(v) => set("category", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
          )}
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Reorder point</Label>
          <Input type="number" min="0" step="any" value={form.reorder_point}
            onChange={(e) => set("reorder_point", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Reorder qty</Label>
          <Input type="number" min="0" step="any" value={form.reorder_qty}
            onChange={(e) => set("reorder_qty", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={submit} disabled={busy || !form.sku || !form.name}>
            {busy ? "Creating…" : "Create item"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
