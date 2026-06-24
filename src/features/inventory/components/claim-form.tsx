"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { submitClaim } from "@/features/inventory/services/actions";
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

export type PoOption = {
  id: string;
  supplier: string | null;
  items: { id: string; name: string; remaining: number }[];
};
export type ItemOption = { id: string; name: string; sku: string };

export function ClaimForm({ pos, items }: { pos: PoOption[]; items: ItemOption[] }) {
  const router = useRouter();
  const [poId, setPoId] = useState("");
  const [poItemId, setPoItemId] = useState("");
  const [invId, setInvId] = useState("");
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedPo = useMemo(() => pos.find((p) => p.id === poId), [pos, poId]);

  async function submit() {
    setBusy(true);
    const res = await submitClaim({
      po_id: poId,
      po_item_id: poItemId,
      inventory_item_id: invId,
      qty_claimed: Number(qty),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Claim submitted");
      setQty("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (pos.length === 0) {
    return <p className="text-sm text-muted-foreground">No open purchase orders to claim against.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Purchase order</Label>
        <Select value={poId} onValueChange={(v) => { setPoId(v ?? ""); setPoItemId(""); }}>
          <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
          <SelectContent>
            {pos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.supplier ?? "PO"} · {p.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>PO item</Label>
        <Select value={poItemId} onValueChange={(v) => setPoItemId(v ?? "")} disabled={!selectedPo}>
          <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
          <SelectContent>
            {selectedPo?.items.map((it) => (
              <SelectItem key={it.id} value={it.id}>
                {it.name} (remaining {it.remaining})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Receive into (catalog item)</Label>
        <Select value={invId} onValueChange={(v) => setInvId(v ?? "")}>
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
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={busy || !poId || !poItemId || !invId || !qty || Number(qty) <= 0}>
          {busy ? "Submitting…" : "Submit claim"}
        </Button>
      </div>
    </div>
  );
}
