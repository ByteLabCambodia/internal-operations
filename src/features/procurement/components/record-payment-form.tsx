"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";

import { type Currency } from "@/lib/money";
import { recordPayment } from "@/features/procurement/services/actions";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/features/procurement/schemas";
import { type ScannedFields } from "@/app/api/ocr/receipt/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/reui/date-picker";
import { FileUpload } from "@/components/reui/file-upload";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [trxId, setTrxId] = useState("");
  const [sender, setSender] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [remark, setRemark] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function scanReceipt() {
    if (!file) return;
    setScanning(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr/receipt", { method: "POST", body: form });
      const data: ScannedFields & { error?: string } = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Scan failed");
        return;
      }
      const filled: string[] = [];
      if (data.amount !== null)  { setAmount(String(data.amount)); filled.push("amount"); }
      if (data.currency)         { setCurrency(data.currency); filled.push("currency"); }
      if (data.reference)        { setReference(data.reference); filled.push("reference"); }
      if (data.trx_id)           { setTrxId(data.trx_id); filled.push("trx ID"); }
      if (data.sender)           { setSender(data.sender); filled.push("sender"); }
      if (data.transfer_to)      { setTransferTo(data.transfer_to); filled.push("transfer to"); }
      if (data.remark)           { setRemark(data.remark); filled.push("remark"); }
      if (data.bank_account)     { setBankAccount(data.bank_account); filled.push("bank account"); }
      if (data.paid_at)          { setPaidAt(data.paid_at); filled.push("date"); }
      if (filled.length > 0) {
        toast.success(`Filled: ${filled.join(", ")}`);
      } else {
        toast.warning("Could not extract fields — please fill in manually");
      }
    } catch {
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      let receiptKey: string | null = null;
      if (file) {
        try { receiptKey = await uploadToR2(file); }
        catch (e) {
          toast.error(`Receipt upload failed: ${e instanceof Error ? e.message : e}`);
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
        trx_id: trxId.trim() || null,
        sender: sender.trim() || null,
        transfer_to: transferTo.trim() || null,
        remark: remark.trim() || null,
        paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
        receipt_object_key: receiptKey,
      });
      if (res.ok) {
        toast.success("Payment recorded");
        setAmount("");
        setBankAccount("");
        setReference("");
        setTrxId("");
        setSender("");
        setTransferTo("");
        setRemark("");
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
        <NumberField
          value={amount === "" ? null : Number(amount)}
          onValueChange={(v) => setAmount(v == null ? "" : String(v))}
          min={0}
        >
          <NumberFieldGroup>
            <NumberFieldInput />
          </NumberFieldGroup>
        </NumberField>
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
        <DatePicker value={paidAt} onValueChange={setPaidAt} />
      </div>
      <div className="space-y-2">
        <Label>Transfer to</Label>
        <Input
          placeholder="Recipient name"
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Sender</Label>
        <Input
          placeholder="Sender name"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Bank / account (To)</Label>
        <Input
          placeholder="e.g. 001 682 289"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Reference #</Label>
        <Input
          placeholder="e.g. 100FT38128643515"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Trx. ID</Label>
        <Input
          placeholder="Transaction ID"
          value={trxId}
          onChange={(e) => setTrxId(e.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Remark</Label>
        <Textarea
          placeholder="Payment description / remark"
          value={remark}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemark(e.target.value)}
          rows={2}
        />
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
        <Button onClick={submit} disabled={busy || !amount || Number(amount) <= 0}>
          {busy ? "Recording…" : "Record payment"}
        </Button>
      </div>
    </div>
  );
}
