"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { format as formatMoney, formatUsd, toUsd, type Currency } from "@/lib/money";
import { createPurchaseRequest } from "@/features/procurement/services/actions";
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
import { Card, CardContent } from "@/components/ui/card";

type Option = { id: string; name: string };
type Line = { name: string; qty: string; unit_price_original: string; category: string };

const EMPTY: Line = { name: "", qty: "1", unit_price_original: "0", category: "" };

export function PrForm({
  departments,
  projects,
  rates,
}: {
  departments: Option[];
  projects: Option[];
  rates: Record<Currency, number>;
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY }]);
  const [submitting, setSubmitting] = useState(false);

  const rate = rates[currency] || (currency === "USD" ? 1 : 0);

  const totalOriginal = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unit_price_original) || 0), 0),
    [lines],
  );
  const totalUsd = rate > 0 ? toUsd(totalOriginal, rate) : 0;

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setSubmitting(true);
    const res = await createPurchaseRequest({
      currency,
      department_id: departmentId || null,
      project_id: projectId || null,
      note: note || undefined,
      items: lines.map((l) => ({
        name: l.name,
        qty: Number(l.qty),
        unit_price_original: Number(l.unit_price_original),
        category: l.category || undefined,
      })),
    });
    setSubmitting(false);

    if (res.ok) {
      toast.success("Purchase request submitted");
      router.push(`/purchase-requests/${res.id}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
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
            <p className="text-xs text-muted-foreground">
              {currency === "USD"
                ? "Base currency"
                : rate > 0
                  ? `Locked rate: ${rate} ${currency}/USD`
                  : `No rate configured for ${currency}`}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="None">
                  {(v: string) => departments.find((d) => d.id === v)?.name ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="None">
                  {(v: string) => projects.find((p) => p.id === v)?.name ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
            <span className="col-span-5">Item</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-2">Unit price</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-1" />
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <Input
                className="col-span-5"
                placeholder="Item name"
                value={line.name}
                onChange={(e) => updateLine(i, { name: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                min="0"
                step="any"
                value={line.qty}
                onChange={(e) => updateLine(i, { qty: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                min="0"
                step="any"
                value={line.unit_price_original}
                onChange={(e) => updateLine(i, { unit_price_original: e.target.value })}
              />
              <Input
                className="col-span-2"
                placeholder="—"
                value={line.category}
                onChange={(e) => updateLine(i, { category: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, { ...EMPTY }])}>
            <Plus className="size-4" /> Add item
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Note</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/30 p-4">
        <div className="text-sm">
          <div className="text-muted-foreground">Total</div>
          <div className="text-lg font-semibold tabular-nums">
            {formatMoney(totalOriginal, currency)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ≈ {formatUsd(totalUsd)}
            </span>
          </div>
        </div>
        <Button onClick={submit} disabled={submitting || (currency !== "USD" && rate <= 0)}>
          {submitting ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </div>
  );
}
