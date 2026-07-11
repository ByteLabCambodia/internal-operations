"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { adjustStock } from "@/features/inventory/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

export function AdjustForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await adjustStock({
      inventory_item_id: itemId,
      delta: Number(delta),
      note: note || undefined,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Stock adjusted");
      setDelta("");
      setNote("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto] sm:items-end">
      <div className="space-y-2">
        <Label>Delta (+/−)</Label>
        <NumberField
          value={delta === "" ? null : Number(delta)}
          onValueChange={(v) => setDelta(v == null ? "" : String(v))}
        >
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput placeholder="e.g. -2" />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      </div>
      <div className="space-y-2">
        <Label>Note</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" />
      </div>
      <Button onClick={submit} disabled={busy || !delta || Number(delta) === 0}>
        {busy ? "Adjusting…" : "Adjust"}
      </Button>
    </div>
  );
}
