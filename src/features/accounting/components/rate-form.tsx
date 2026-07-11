"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { upsertRate } from "@/features/accounting/services/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/reui/date-picker";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/reui/number-field";
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
      <DatePicker value={date} onValueChange={setDate} />
      <Select value={currency} onValueChange={(v) => setCurrency((v ?? "KHR") as "KHR" | "CNY")}>
        <SelectTrigger id="rate-currency" className="w-full py-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="KHR">KHR</SelectItem>
          <SelectItem value="CNY">CNY</SelectItem>
        </SelectContent>
      </Select>
      <NumberField
        value={rate === "" ? null : Number(rate)}
        onValueChange={(v) => setRate(v == null ? "" : String(v))}
        min={0}
      >
        <NumberFieldGroup>
          <NumberFieldInput id="rate-value" placeholder="e.g. 4100" />
        </NumberFieldGroup>
      </NumberField>
      <Button onClick={submit} disabled={busy || !rate || Number(rate) <= 0}>
        {busy ? "Saving…" : "Save rate"}
      </Button>
    </div>
  );
}
