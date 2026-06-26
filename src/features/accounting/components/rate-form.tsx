"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { upsertRate } from "@/features/accounting/services/actions";
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

export function RateForm() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [currency, setCurrency] = useState<"KHR" | "CNY">("KHR");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await upsertRate({ rate_date: date, currency, rate_to_usd: Number(rate) });
    setBusy(false);
    if (res.ok) {
      toast.success("Rate saved");
      setRate("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="inline-grid grid-cols-[9rem_7rem_9rem_auto] items-end gap-x-3 gap-y-1.5">
      <Label htmlFor="rate-date">Date</Label>
      <Label htmlFor="rate-currency">Currency</Label>
      <Label htmlFor="rate-value">Rate (per USD)</Label>
      <span />
      <Input id="rate-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Select value={currency} onValueChange={(v) => setCurrency((v ?? "KHR") as "KHR" | "CNY")}>
        <SelectTrigger id="rate-currency" className="w-full py-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="KHR">KHR</SelectItem>
          <SelectItem value="CNY">CNY</SelectItem>
        </SelectContent>
      </Select>
      <Input id="rate-value" type="number" min="0" step="any" placeholder="e.g. 4100" value={rate} onChange={(e) => setRate(e.target.value)} />
      <Button onClick={submit} disabled={busy || !rate || Number(rate) <= 0}>
        {busy ? "Saving…" : "Save rate"}
      </Button>
    </div>
  );
}
