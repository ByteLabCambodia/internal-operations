"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { submitStockRequest } from "@/features/stock/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StockRequestForm({ items }: { items: { id: string; name: string; sku: string }[] }) {
  const router = useRouter();
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await submitStockRequest({
      inventory_item_id: itemId,
      qty: Number(qty),
      note: note || undefined,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Stock request submitted");
      setQty("");
      setNote("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Item</Label>
        <Select value={itemId} onValueChange={(v) => setItemId(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.id} value={it.id}>{it.sku} · {it.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Note</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={busy || !itemId || !qty || Number(qty) <= 0}>
          {busy ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </div>
  );
}
