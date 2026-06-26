"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Link2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Option = { id: string; name: string };
type Line = { name: string; qty_ordered: string; unit_price_original: string };
type ApprovedPr = { id: string; pr_number: string; currency: Currency; total_original: number };

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
  approvedPrs: ApprovedPr[];
  prefill: {
    pr_id: string;
    pr_number: string;
    currency: Currency;
    department_id: string | null;
    project_id: string | null;
    items: { name: string; qty_ordered: number; unit_price_original: number }[];
  } | null;
}) {
  const router = useRouter();
  const [pendingPr, setPendingPr] = useState<ApprovedPr | null>(null);
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

  function handlePrSelect(prId: string) {
    const pr = approvedPrs.find((p) => p.id === prId) ?? null;
    setPendingPr(pr);
    router.push(`/purchase-orders/new?pr=${prId}`);
  }

  async function submit() {
    if (!prefill) return;
    setSubmitting(true);
    const res = await createPurchaseOrder({
      pr_id: prefill.pr_id,
      type: "online",
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

  const linkedPr = prefill
    ? approvedPrs.find((p) => p.id === prefill.pr_id) ?? null
    : pendingPr;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Approved request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefill || pendingPr ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
              <Link2 className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono">
                  {prefill?.pr_number ?? linkedPr?.pr_number}
                </p>
                {linkedPr && (
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(linkedPr.total_original, linkedPr.currency)} · {linkedPr.currency}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setPendingPr(null); router.push("/purchase-orders/new"); }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <Select onValueChange={(v) => { if (typeof v === "string" && v) handlePrSelect(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an approved request…" />
                </SelectTrigger>
                <SelectContent>
                  {approvedPrs.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No approved requests available
                    </div>
                  ) : (
                    approvedPrs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.pr_number} — {formatMoney(p.total_original, p.currency)} {p.currency}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a request will pre-fill items, currency, and allocation.
              </p>
            </>
          )}

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
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
                {currency === "USD"
                  ? "Base currency — no conversion needed"
                  : rate > 0
                    ? `Rate: 1 USD = ${rate} ${currency}`
                    : `No rate locked for ${currency} today`}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Line items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
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
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm"
            onClick={() => setLines((p) => [...p, { ...EMPTY }])}>
            <Plus className="size-4" /> Add item
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Order total</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(totalOriginal, currency)}
            {currency !== "USD" && rate > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ≈ {formatUsd(totalUsd)}
              </span>
            )}
          </p>
        </div>
        <Button onClick={submit} disabled={!prefill || submitting || (currency !== "USD" && rate <= 0)} size="lg">
          {submitting ? "Creating…" : "Create PO"}
        </Button>
      </div>
    </div>
  );
}
