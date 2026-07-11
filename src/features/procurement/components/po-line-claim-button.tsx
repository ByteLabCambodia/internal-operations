"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";

import { submitClaim } from "@/features/inventory/services/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CatalogOption = { id: string; name: string; sku: string };

/**
 * Per-line "Claim received" action on the PO detail page. Pre-fills the PO and
 * PO item so the admin never has to search for the order. If the PO line is
 * already linked to a catalog item we receive into that automatically;
 * otherwise the admin picks which catalog item to stock.
 */
export function PoLineClaimButton({
  poId,
  poItemId,
  itemName,
  remaining,
  linkedInventoryItemId,
  catalogItems,
}: {
  poId: string;
  poItemId: string;
  itemName: string;
  remaining: number;
  linkedInventoryItemId: string | null;
  catalogItems: CatalogOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(String(remaining));
  const [invId, setInvId] = useState(linkedInventoryItemId ?? "");
  const [busy, setBusy] = useState(false);

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
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <PackageCheck className="size-4" /> Claim
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim received goods</DialogTitle>
          <DialogDescription>
            {itemName} — {remaining} remaining to claim.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!linkedInventoryItemId && (
            <div className="space-y-2">
              <Label>Receive into (catalog item)</Label>
              <Select value={invId} onValueChange={(v) => setInvId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item">
                    {(v: string) => {
                      const it = catalogItems.find((it) => it.id === v);
                      return it ? `${it.sku} · ${it.name}` : v;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {catalogItems.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.sku} · {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantity</Label>
            <NumberField
              value={qty === "" ? null : Number(qty)}
              onValueChange={(v) => setQty(v == null ? "" : String(v))}
              min={0}
              max={remaining}
            >
              <NumberFieldGroup>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={busy || !invId || !qty || Number(qty) <= 0}
          >
            {busy ? "Submitting…" : "Submit claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
