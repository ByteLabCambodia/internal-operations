"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { type Currency } from "@/lib/money";
import { recordPayment } from "@/features/procurement/services/actions";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/features/procurement/schemas";
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

/** Uploads a receipt to R2 via a presigned URL; returns the object key. */
async function uploadReceipt(file: File): Promise<string> {
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

export function RecordPaymentForm({
  poId,
  defaultCurrency,
}: {
  poId: string;
  defaultCurrency: Currency;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [bankAccount, setBankAccount] = useState("");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      let receiptKey: string | null = null;
      if (file) {
        try {
          receiptKey = await uploadReceipt(file);
        } catch (e) {
          toast.error(`Receipt upload failed: ${e instanceof Error ? e.message : e}`);
          setBusy(false);
          return;
        }
      }
      const res = await recordPayment({
        po_id: poId,
        amount_original: Number(amount),
        currency,
        method,
        bank_account: bankAccount.trim() || null,
        reference: reference.trim() || null,
        paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
        receipt_object_key: receiptKey,
      });
      if (res.ok) {
        toast.success("Payment recorded");
        setAmount("");
        setBankAccount("");
        setReference("");
        setFile(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Select value={currency} onValueChange={(v) => setCurrency((v ?? "USD") as Currency)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="KHR">KHR</SelectItem>
            <SelectItem value="CNY">CNY</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Payment method</Label>
        <Select value={method} onValueChange={(v) => setMethod((v ?? "bank_transfer") as PaymentMethod)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Payment date</Label>
        <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Bank / account</Label>
        <Input
          placeholder="e.g. ABA · 000 123 456"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Reference / txn no.</Label>
        <Input
          placeholder="Transaction reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Receipt (optional)</Label>
        <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={busy || !amount || Number(amount) <= 0}>
          {busy ? "Recording…" : "Record payment"}
        </Button>
      </div>
    </div>
  );
}
