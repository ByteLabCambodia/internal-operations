"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";

import { submitClaim } from "@/features/inventory/services/actions";
import { type ScannedFields } from "@/app/api/ocr/receipt/route";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/reui/file-upload";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
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
  po_number: string;
  supplier: string | null;
  items: { id: string; name: string; remaining: number }[];
};
export type ItemOption = { id: string; name: string; sku: string };

async function uploadToR2(file: File): Promise<string> {
  const res = await fetch("/api/r2/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "presign failed");
  const { uploadUrl, objectKey } = await res.json();
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
  if (!put.ok) throw new Error("upload failed");
  return objectKey;
}

export function ClaimForm({ pos, items }: { pos: PoOption[]; items: ItemOption[] }) {
  const router = useRouter();
  const [poId, setPoId] = useState("");
  const [poItemId, setPoItemId] = useState("");
  const [invId, setInvId] = useState("");
  const [qty, setQty] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedPo = useMemo(() => pos.find((p) => p.id === poId), [pos, poId]);

  async function scanReceipt() {
    if (!file) return;
    setScanning(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr/receipt", { method: "POST", body: form });
      const data: ScannedFields & { error?: string } = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Scan failed"); return; }
      if (data.qty !== null) {
        setQty(String(data.qty));
        toast.success("Filled: quantity");
      } else {
        toast.warning("Could not extract quantity — please fill in manually");
      }
    } catch {
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function submit() {
    setBusy(true);
    let receiptKey: string | null = null;
    if (file) {
      try { receiptKey = await uploadToR2(file); }
      catch (e) {
        toast.error(`Receipt upload failed: ${e instanceof Error ? e.message : e}`);
        setBusy(false);
        return;
      }
    }
    const res = await submitClaim({
      po_id: poId,
      po_item_id: poItemId,
      inventory_item_id: invId,
      qty_claimed: Number(qty),
      receipt_object_key: receiptKey,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Claim submitted");
      setQty("");
      setFile(null);
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
          <SelectTrigger>
            <SelectValue placeholder="Select PO">
              {(v: string) => { const p = pos.find((p) => p.id === v); return p ? `${p.po_number}${p.supplier ? ` · ${p.supplier}` : ""}` : v; }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.po_number}{p.supplier ? ` · ${p.supplier}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>PO item</Label>
        <Select value={poItemId} onValueChange={(v) => setPoItemId(v ?? "")} disabled={!selectedPo}>
          <SelectTrigger>
            <SelectValue placeholder="Select item">
              {(v: string) => { const it = selectedPo?.items.find((it) => it.id === v); return it ? `${it.name} (remaining ${it.remaining})` : v; }}
            </SelectValue>
          </SelectTrigger>
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
          <SelectTrigger>
            <SelectValue placeholder="Select item">
              {(v: string) => { const it = items.find((it) => it.id === v); return it ? `${it.sku} · ${it.name}` : v; }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.id} value={it.id}>{it.sku} · {it.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Quantity</Label>
        <NumberField
          value={qty === "" ? null : Number(qty)}
          onValueChange={(v) => setQty(v == null ? "" : String(v))}
          min={0}
        >
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Receipt (optional)</Label>
        <FileUpload value={file} onChange={setFile} accept="image/*, application/pdf">
          <Button type="button" variant="outline" size="sm" onClick={scanReceipt} disabled={scanning}>
            <ScanLine className="mr-1.5 h-4 w-4" />
            {scanning ? "Scanning…" : "Scan receipt"}
          </Button>
        </FileUpload>
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={busy || !poId || !poItemId || !invId || !qty || Number(qty) <= 0}>
          {busy ? "Submitting…" : "Submit claim"}
        </Button>
      </div>
    </div>
  );
}
