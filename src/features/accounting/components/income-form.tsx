"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { type Currency } from "@/lib/money";
import { addIncome } from "@/features/accounting/services/actions";
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

type Option = { id: string; name: string };

export function IncomeForm({ incomeAccounts }: { incomeAccounts: Option[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [accountId, setAccountId] = useState(incomeAccounts[0]?.id ?? "");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await addIncome({
      amount_original: Number(amount),
      currency,
      account_id: accountId,
      memo: memo || undefined,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Income recorded");
      setAmount("");
      setMemo("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
        <Label>Income account</Label>
        <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {incomeAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Memo</Label>
        <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Optional" />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={busy || !amount || Number(amount) <= 0 || !accountId}>
          {busy ? "Recording…" : "Record income"}
        </Button>
      </div>
    </div>
  );
}
