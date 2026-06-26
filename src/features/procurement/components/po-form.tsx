"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { format as formatMoney, formatUsd, toUsd, type Currency } from "@/lib/money";
import { createPurchaseOrder } from "@/features/procurement/services/actions";
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
type Line = { name: string; qty_ordered: string; unit_price_original: string };

const EMPTY: Line = { name: "", qty_ordered: "1", unit_price_original: "0" };

export function PoForm({
  departments,
  projects,
  rates,
  approvedPrs,
  prefill,
}: {
  departments: Option[];
  projects: Option[];
  rates: Record<Currency, number>;
  approvedPrs: { id: string; currency: Currency }[];
  prefill: {
    pr_id: string;
    currency: Currency;
    department_id: string | null;
    project_id: string | null;
    items: { name: string; qty_ordered: number; unit_price_original: number }[];
  } | null;
}) {
  const router = useRouter();
  const [type, setType] = useState<"online" | "physical">(prefill ? "online" : "physical");
  const [selectedPrId, setSelectedPrId] = useState("");
  const [supplier, setSupplier] = useState("");
  const [currency, setCurrency] = useState<Currency>(prefill?.currency ?? "USD");
  const [departmentId, setDepartmentId] = useState(prefill?.department_id ?? "");
  const [projectId, setProjectId] = useState(prefill?.project_id ?? "");
  const [lines, setLines] = useState<Line[]>(
    prefill
      ? prefill.items.map((i) => ({
          name: i.name,
          qty_ordered: String(i.qty_ordered),
          unit_price_original: String(i.unit_price_original),
        }))
      : [{ ...EMPTY }],
  );
  const [submitting, setSubmitting] = useState(false);

  const rate = rates[currency] || (currency === "USD" ? 1 : 0);
  const totalOriginal = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.qty_ordered) || 0) * (Number(l.unit_price_original) || 0), 0),
    [lines],
  );
  const totalUsd = rate > 0 ? toUsd(totalOriginal, rate) : 0;

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setSubmitting(true);
    const res = await createPurchaseOrder({
      pr_id: prefill?.pr_id ?? selectedPrId,
      type,
      supplier: supplier || undefined,
      currency,
      department_id: departmentId || null,
      project_id: projectId || null,
      items: lines.map((l) => ({
        name: l.name,
        qty_ordered: Number(l.qty_ordered),
        unit_price_original: Number(l.unit_price_original),
      })),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Purchase order created");
      router.push(`/purchase-orders/${res.id}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType((v ?? "physical") as "online" | "physical")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online (from request)</SelectItem>
                <SelectItem value="physical">Physical (direct)</SelectItem>
              </SelectContent>
            </Select>
            {prefill ? (
              <p className="text-xs text-muted-foreground">Linked to request {prefill.pr_id.slice(0, 8)}…</p>
            ) : (
              <div className="mt-2 flex gap-2">
                <Select value={selectedPrId} onValueChange={(v) => setSelectedPrId(v ?? "")}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select approved request…" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedPrs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.id.slice(0, 8)}… ({p.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!selectedPrId}
                  onClick={() => router.push(`/purchase-orders/new?pr=${selectedPrId}`)}
                >
                  Load
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Taobao" />
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
            <p className="text-xs text-muted-foreground">
              {currency === "USD" ? "Base currency" : rate > 0 ? `Locked rate: ${rate} ${currency}/USD` : `No rate for ${currency}`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="None">
                    {(v: string) => departments.find((d) => d.id === v)?.name ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
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
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
            <span className="col-span-6">Item</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-3">Unit price</span>
            <span className="col-span-1" />
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <Input className="col-span-6" placeholder="Item name" value={line.name}
                onChange={(e) => updateLine(i, { name: e.target.value })} />
              <Input className="col-span-2" type="number" min="0" step="any" value={line.qty_ordered}
                onChange={(e) => updateLine(i, { qty_ordered: e.target.value })} />
              <Input className="col-span-3" type="number" min="0" step="any" value={line.unit_price_original}
                onChange={(e) => updateLine(i, { unit_price_original: e.target.value })} />
              <Button type="button" variant="ghost" size="icon" className="col-span-1"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, { ...EMPTY }])}>
            <Plus className="size-4" /> Add item
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-md border bg-muted/30 p-4">
        <div className="text-sm">
          <div className="text-muted-foreground">Total</div>
          <div className="text-lg font-semibold tabular-nums">
            {formatMoney(totalOriginal, currency)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">≈ {formatUsd(totalUsd)}</span>
          </div>
        </div>
        <Button onClick={submit} disabled={submitting || (currency !== "USD" && rate <= 0) || (!prefill && !selectedPrId)}>
          {submitting ? "Creating…" : "Create PO"}
        </Button>
      </div>
    </div>
  );
}
