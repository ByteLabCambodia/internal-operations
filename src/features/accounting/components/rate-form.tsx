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
    <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Select value={currency} onValueChange={(v) => setCurrency((v ?? "KHR") as "KHR" | "CNY")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="KHR">KHR</SelectItem>
            <SelectItem value="CNY">CNY</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Rate (per USD)</Label>
        <Input type="number" min="0" step="any" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={busy || !rate || Number(rate) <= 0}>
        {busy ? "Saving…" : "Save rate"}
      </Button>
    </div>
  );
}
