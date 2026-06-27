"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Screen = "loading" | "no-telegram" | "error" | "link" | "home" | "pr-form" | "stock-form" | "claim-form" | "submitted" | "history";
type AuthFetch = (path: string, options?: RequestInit) => Promise<Response>;
type Profile = { id: string; full_name: string | null; role: string };
type InventoryItem = { id: string; sku: string; name: string; unit: string };
type PoOption = { id: string; label: string; items: { id: string; name: string; remaining: number }[] };
type Currency = "USD" | "KHR" | "CNY";

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void } };
    __APP_URL__?: string;
  }
}

function appUrl(path: string) {
  const base = window.__APP_URL__ || "";
  return `${base}${path}`;
}

// ── PR Form ─────────────────────────────────────────────────────────────────

type PrItem = { id: number; name: string; qty: string; price: string };

function PrForm({
  fetchWithAuth,
  rates,
  onBack,
  onDone,
}: {
  fetchWithAuth: AuthFetch;
  rates: Record<string, number>;
  onBack: () => void;
  onDone: (msg: string) => void;
}) {
  const [items, setItems] = useState<PrItem[]>([{ id: 1, name: "", qty: "1", price: "" }]);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(id: number, field: keyof Omit<PrItem, "id">, value: string) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, [field]: value } : it));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: Date.now(), name: "", qty: "1", price: "" }]);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const rate = rates[currency] ?? 1;
  const total = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const totalUsd = currency === "USD" ? total : total / rate;
  const canSubmit = items.length > 0 && items.every((it) => it.name && Number(it.qty) > 0 && Number(it.price) > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    if (!rates[currency]) {
      setError(`No exchange rate for ${currency}. Ask finance to set today's rate.`);
      setBusy(false);
      return;
    }

    const res = await fetchWithAuth("/api/miniapp/pr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: items.map((it) => ({ name: it.name, qty: Number(it.qty), price: Number(it.price) })),
        currency,
        rate,
        note,
      }),
    });
    const body = await res.json();
    setBusy(false);

    if (!res.ok) { setError(body.error ?? "Failed"); return; }
    onDone(`Purchase request submitted with ${items.length} item${items.length > 1 ? "s" : ""}! A manager will review it shortly.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-auto px-1 text-muted-foreground hover:text-foreground">← Back</Button>
        <h2 className="text-lg font-semibold">New Purchase Request</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
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
        <div className="space-y-1">
          <Label>Note (optional)</Label>
          <Input placeholder="Reason or link" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_3rem_4.5rem_1.5rem] gap-1.5 px-0.5">
          <span className="text-xs font-medium text-muted-foreground">Item name</span>
          <span className="text-xs font-medium text-muted-foreground">Qty</span>
          <span className="text-xs font-medium text-muted-foreground">Unit price</span>
          <span />
        </div>
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-[1fr_3rem_4.5rem_1.5rem] items-center gap-1.5">
            <Input
              placeholder="Item name"
              value={it.name}
              onChange={(e) => updateItem(it.id, "name", e.target.value)}
              className="text-sm"
            />
            <Input
              type="number" min="1"
              value={it.qty}
              onChange={(e) => updateItem(it.id, "qty", e.target.value)}
              className="text-sm px-2"
            />
            <Input
              type="number" min="0" step="any"
              placeholder="0.00"
              value={it.price}
              onChange={(e) => updateItem(it.id, "price", e.target.value)}
              className="text-sm px-2"
            />
            <button
              onClick={() => removeItem(it.id)}
              disabled={items.length === 1}
              className="text-muted-foreground hover:text-destructive disabled:opacity-30 text-base leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={addItem}>
          + Add item
        </Button>
      </div>

      {total > 0 && (
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}</span>
          {currency !== "USD" && rate && (
            <span className="ml-2 text-muted-foreground">≈ ${totalUsd.toFixed(2)}</span>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={submit} disabled={busy || !canSubmit}>
        {busy ? "Submitting…" : `Submit${items.length > 1 ? ` (${items.length} items)` : ""}`}
      </Button>
    </div>
  );
}

// ── Stock Request Form ───────────────────────────────────────────────────────

type StockItem = { id: number; itemId: string; qty: string };

function StockForm({
  fetchWithAuth,
  items,
  onBack,
  onDone,
}: {
  fetchWithAuth: AuthFetch;
  items: InventoryItem[];
  onBack: () => void;
  onDone: (msg: string) => void;
}) {
  const [rows, setRows] = useState<StockItem[]>([{ id: 1, itemId: "", qty: "1" }]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(id: number, field: keyof Omit<StockItem, "id">, value: string) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: Date.now(), itemId: "", qty: "1" }]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const canSubmit = rows.length > 0 && rows.every((r) => r.itemId && Number(r.qty) > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    const res = await fetchWithAuth("/api/miniapp/stock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: rows.map((r) => ({ itemId: r.itemId, qty: Number(r.qty) })),
        note,
      }),
    });
    const body = await res.json();
    setBusy(false);

    if (!res.ok) { setError(body.error ?? "Failed"); return; }
    onDone(`Stock request submitted for ${rows.length} item${rows.length > 1 ? "s" : ""}! A manager will fulfil it shortly.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-auto px-1 text-muted-foreground hover:text-foreground">← Back</Button>
        <h2 className="text-lg font-semibold">Request Stock</h2>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_3.5rem_1.5rem] gap-1.5 px-0.5">
          <span className="text-xs font-medium text-muted-foreground">Item</span>
          <span className="text-xs font-medium text-muted-foreground">Qty</span>
          <span />
        </div>
        {rows.map((row) => {
          const selected = items.find((i) => i.id === row.itemId);
          return (
            <div key={row.id} className="grid grid-cols-[1fr_3.5rem_1.5rem] items-center gap-1.5">
              <Select value={row.itemId} onValueChange={(v) => updateRow(row.id, "itemId", v ?? "")}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select item">
                    {selected ? `${selected.sku} · ${selected.name}` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.sku} · {i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number" min="1"
                value={row.qty}
                onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                className="text-sm px-2"
                title={selected ? selected.unit : undefined}
              />
              <button
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30 text-base leading-none"
              >
                ×
              </button>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={addRow}>
          + Add item
        </Button>
      </div>

      <div className="space-y-1">
        <Label>Note (optional)</Label>
        <Input placeholder="What it's for" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={submit} disabled={busy || !canSubmit}>
        {busy ? "Submitting…" : `Submit${rows.length > 1 ? ` (${rows.length} items)` : ""}`}
      </Button>
    </div>
  );
}

// ── Claim Form ───────────────────────────────────────────────────────────────

function ClaimForm({
  fetchWithAuth,
  pos,
  items,
  onBack,
  onDone,
}: {
  fetchWithAuth: AuthFetch;
  pos: PoOption[];
  items: InventoryItem[];
  onBack: () => void;
  onDone: (msg: string) => void;
}) {
  const [poId, setPoId] = useState("");
  const [poItemId, setPoItemId] = useState("");
  const [invId, setInvId] = useState("");
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPo = pos.find((p) => p.id === poId);
  const selectedPoItem = selectedPo?.items.find((it) => it.id === poItemId);

  async function submit() {
    if (!poId || !poItemId || !invId || !qty) return;
    setBusy(true);
    setError(null);

    const res = await fetchWithAuth("/api/miniapp/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ poId, poItemId, inventoryItemId: invId, qty: Number(qty) }),
    });
    const body = await res.json();
    setBusy(false);

    if (!res.ok) { setError(body.error ?? "Failed"); return; }
    onDone("Claim submitted! A manager will confirm receipt shortly.");
  }

  if (pos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-auto px-1 text-muted-foreground hover:text-foreground">← Back</Button>
          <h2 className="text-lg font-semibold">Submit Claim</h2>
        </div>
        <p className="text-sm text-muted-foreground">No open purchase orders to claim against. Check with your manager.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-auto px-1 text-muted-foreground hover:text-foreground">← Back</Button>
        <h2 className="text-lg font-semibold">Submit Claim</h2>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Purchase order</Label>
          <Select value={poId} onValueChange={(v) => { setPoId(v ?? ""); setPoItemId(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select PO">
                {selectedPo ? selectedPo.label : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pos.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>PO item</Label>
          <Select value={poItemId} onValueChange={(v) => setPoItemId(v ?? "")} disabled={!selectedPo}>
            <SelectTrigger>
              <SelectValue placeholder="Select item">
                {selectedPoItem ? `${selectedPoItem.name} (remaining ${selectedPoItem.remaining})` : undefined}
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
        <div className="space-y-1">
          <Label>Receive into (catalog item)</Label>
          <Select value={invId} onValueChange={(v) => setInvId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select item">
                {items.find((i) => i.id === invId) ? `${items.find((i) => i.id === invId)!.sku} · ${items.find((i) => i.id === invId)!.name}` : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {items.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.sku} · {i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={submit} disabled={busy || !poId || !poItemId || !invId || !qty || Number(qty) <= 0}>
          {busy ? "Submitting…" : "Submit claim"}
        </Button>
      </div>
    </div>
  );
}

// ── History View ─────────────────────────────────────────────────────────────

type HistoryPr = { id: string; pr_number: string; status: string; total_original: number; currency: string; created_at: string };
type HistoryStock = { id: string; item_name: string; sku: string; qty: number; status: string; created_at: string };
type HistoryClaim = { id: string; item_name: string; sku: string; qty_claimed: number; status: string; created_at: string };
type PrDetail = {
  id: string; pr_number: string; status: string; currency: string; exchange_rate: number;
  total_original: number; note: string | null; created_at: string;
  items: Array<{ id: string; name: string; qty: number; unit_price_original: number }>;
};
type StockDetail = { id: string; item_name: string; sku: string; unit: string; qty: number; status: string; note: string | null; created_at: string };
type ClaimDetail = { id: string; item_name: string; sku: string; qty_claimed: number; status: string; po_number: string | null; supplier: string | null; created_at: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  fulfilled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  converted: "bg-purple-100 text-purple-800",
};

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── PR detail + edit ─────────────────────────────────────────────────────────

function PrDetailPanel({ id, fetchWithAuth, rates, onBack }: { id: string; fetchWithAuth: AuthFetch; rates: Record<string, number>; onBack: () => void }) {
  const [pr, setPr] = useState<PrDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<PrItem[]>([]);
  const [editCurrency, setEditCurrency] = useState<Currency>("USD");
  const [editNote, setEditNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchWithAuth(`/api/miniapp/history/pr/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load");
        const data: PrDetail = await r.json();
        setPr(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit() {
    if (!pr) return;
    setEditItems(pr.items.map((it, i) => ({ id: i, name: it.name, qty: String(it.qty), price: String(it.unit_price_original) })));
    setEditCurrency(pr.currency as Currency);
    setEditNote(pr.note ?? "");
    setError(null);
    setEditing(true);
  }

  function updateEditItem(id: number, field: keyof Omit<PrItem, "id">, value: string) {
    setEditItems((prev) => prev.map((it) => it.id === id ? { ...it, [field]: value } : it));
  }

  async function saveEdit() {
    if (!pr) return;
    const rate = rates[editCurrency] ?? pr.exchange_rate;
    setBusy(true);
    setError(null);
    const res = await fetchWithAuth(`/api/miniapp/history/pr/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: editItems.map((it) => ({ name: it.name, qty: Number(it.qty), price: Number(it.price) })),
        currency: editCurrency,
        rate,
        note: editNote,
      }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setError(body.error ?? "Failed"); return; }
    setEditing(false);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>;
  if (error && !pr) return <p className="text-sm text-destructive py-4 text-center">{error}</p>;
  if (!pr) return null;

  if (editing) {
    const total = editItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const canSave = editItems.length > 0 && editItems.every((it) => it.name && Number(it.qty) > 0 && Number(it.price) > 0);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:text-foreground">← Cancel</button>
          <h2 className="font-semibold">Edit {pr.pr_number}</h2>
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Select value={editCurrency} onValueChange={(v) => setEditCurrency(v as Currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["USD", "KHR", "CNY"] as Currency[]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {editItems.map((it) => (
            <div key={it.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-1">
                <Input placeholder="Item name" value={it.name} onChange={(e) => updateEditItem(it.id, "name", e.target.value)} className="flex-1" />
                {editItems.length > 1 && (
                  <button onClick={() => setEditItems((p) => p.filter((x) => x.id !== it.id))} className="text-muted-foreground hover:text-destructive px-1">×</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="1" placeholder="Qty" value={it.qty} onChange={(e) => updateEditItem(it.id, "qty", e.target.value)} />
                <Input type="number" min="0" placeholder={`Price (${editCurrency})`} value={it.price} onChange={(e) => updateEditItem(it.id, "price", e.target.value)} />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => setEditItems((p) => [...p, { id: Date.now(), name: "", qty: "1", price: "" }])}>
            + Add item
          </Button>
        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          Total: <span className="font-semibold">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {editCurrency}</span>
        </div>
        <div className="space-y-1">
          <Label>Note (optional)</Label>
          <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Reason or notes" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={saveEdit} disabled={busy || !canSave}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h2 className="font-semibold flex-1">Purchase Request</h2>
        <StatusPill status={pr.status} />
      </div>
      <div className="rounded-lg border p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Number</span>
          <span className="font-mono font-semibold">{pr.pr_number}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span>{formatDate(pr.created_at)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{Number(pr.total_original).toLocaleString()} {pr.currency}</span>
        </div>
        {pr.note && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Note</span>
            <span className="text-right max-w-[60%]">{pr.note}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Items</p>
        <div className="space-y-1.5">
          {pr.items.map((it) => (
            <div key={it.id} className="flex justify-between rounded-md border px-3 py-2 text-sm">
              <span>{it.name}</span>
              <span className="text-muted-foreground">×{Number(it.qty)} @ {Number(it.unit_price_original)} {pr.currency}</span>
            </div>
          ))}
        </div>
      </div>
      {pr.status === "pending" && (
        <Button className="w-full" variant="outline" onClick={startEdit}>✏️ Edit request</Button>
      )}
    </div>
  );
}

// ── Stock detail + edit ───────────────────────────────────────────────────────

function StockDetailPanel({ id, fetchWithAuth, onBack }: { id: string; fetchWithAuth: AuthFetch; onBack: () => void }) {
  const [sr, setSr] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editQty, setEditQty] = useState("");
  const [editNote, setEditNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchWithAuth(`/api/miniapp/history/stock/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load");
        const data: StockDetail = await r.json();
        setSr(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveEdit() {
    setBusy(true);
    setError(null);
    const res = await fetchWithAuth(`/api/miniapp/history/stock/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qty: Number(editQty), note: editNote }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setError(body.error ?? "Failed"); return; }
    setEditing(false);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>;
  if (error && !sr) return <p className="text-sm text-destructive py-4 text-center">{error}</p>;
  if (!sr) return null;

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:text-foreground">← Cancel</button>
          <h2 className="font-semibold">Edit Stock Request</h2>
        </div>
        <div className="rounded-md border px-3 py-2 text-sm">
          <p className="font-medium">{sr.item_name}</p>
          <p className="text-muted-foreground text-xs">{sr.sku}</p>
        </div>
        <div className="space-y-1">
          <Label>Quantity {sr.unit ? `(${sr.unit})` : ""}</Label>
          <Input type="number" min="1" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Note (optional)</Label>
          <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Reason or notes" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={saveEdit} disabled={busy || !editQty || Number(editQty) <= 0}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h2 className="font-semibold flex-1">Stock Request</h2>
        <StatusPill status={sr.status} />
      </div>
      <div className="rounded-lg border p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Item</span>
          <span className="font-medium">{sr.item_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">SKU</span>
          <span className="font-mono">{sr.sku}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Qty</span>
          <span className="font-semibold">{sr.qty}{sr.unit ? ` ${sr.unit}` : ""}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span>{formatDate(sr.created_at)}</span>
        </div>
        {sr.note && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Note</span>
            <span className="text-right max-w-[60%]">{sr.note}</span>
          </div>
        )}
      </div>
      {sr.status === "pending" && (
        <Button className="w-full" variant="outline" onClick={() => { setEditQty(String(sr.qty)); setEditNote(sr.note ?? ""); setError(null); setEditing(true); }}>
          ✏️ Edit request
        </Button>
      )}
    </div>
  );
}

// ── Claim detail + edit ───────────────────────────────────────────────────────

function ClaimDetailPanel({ id, fetchWithAuth, onBack }: { id: string; fetchWithAuth: AuthFetch; onBack: () => void }) {
  const [cl, setCl] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editQty, setEditQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchWithAuth(`/api/miniapp/history/claim/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load");
        const data: ClaimDetail = await r.json();
        setCl(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveEdit() {
    setBusy(true);
    setError(null);
    const res = await fetchWithAuth(`/api/miniapp/history/claim/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qty_claimed: Number(editQty) }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setError(body.error ?? "Failed"); return; }
    setEditing(false);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>;
  if (error && !cl) return <p className="text-sm text-destructive py-4 text-center">{error}</p>;
  if (!cl) return null;

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:text-foreground">← Cancel</button>
          <h2 className="font-semibold">Edit Claim</h2>
        </div>
        <div className="rounded-md border px-3 py-2 text-sm">
          <p className="font-medium">{cl.item_name}</p>
          <p className="text-muted-foreground text-xs">{cl.sku}</p>
        </div>
        <div className="space-y-1">
          <Label>Quantity claimed</Label>
          <Input type="number" min="1" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={saveEdit} disabled={busy || !editQty || Number(editQty) <= 0}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h2 className="font-semibold flex-1">Inventory Claim</h2>
        <StatusPill status={cl.status} />
      </div>
      <div className="rounded-lg border p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Item</span>
          <span className="font-medium">{cl.item_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">SKU</span>
          <span className="font-mono">{cl.sku}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Qty claimed</span>
          <span className="font-semibold">{cl.qty_claimed}</span>
        </div>
        {cl.po_number && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">PO</span>
            <span className="font-mono">{cl.po_number}</span>
          </div>
        )}
        {cl.supplier && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Supplier</span>
            <span>{cl.supplier}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span>{formatDate(cl.created_at)}</span>
        </div>
      </div>
      {cl.status === "pending" && (
        <Button className="w-full" variant="outline" onClick={() => { setEditQty(String(cl.qty_claimed)); setError(null); setEditing(true); }}>
          ✏️ Edit claim
        </Button>
      )}
    </div>
  );
}

// ── History list + sub-navigation ────────────────────────────────────────────

type HistorySubScreen =
  | { view: "list" }
  | { view: "pr-detail"; id: string }
  | { view: "stock-detail"; id: string }
  | { view: "claim-detail"; id: string };

function HistoryView({
  fetchWithAuth,
  rates,
  onBack,
}: {
  fetchWithAuth: AuthFetch;
  rates: Record<string, number>;
  onBack: () => void;
}) {
  const [sub, setSub] = useState<HistorySubScreen>({ view: "list" });
  const [tab, setTab] = useState<"prs" | "stock" | "claims">("prs");
  const [prs, setPrs] = useState<HistoryPr[]>([]);
  const [stocks, setStocks] = useState<HistoryStock[]>([]);
  const [claims, setClaims] = useState<HistoryClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth("/api/miniapp/history")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        setPrs(data.prs ?? []);
        setStocks(data.stockRequests ?? []);
        setClaims(data.claims ?? []);
      })
      .catch((e) => setListError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (sub.view === "pr-detail") {
    return <PrDetailPanel id={sub.id} fetchWithAuth={fetchWithAuth} rates={rates} onBack={() => setSub({ view: "list" })} />;
  }
  if (sub.view === "stock-detail") {
    return <StockDetailPanel id={sub.id} fetchWithAuth={fetchWithAuth} onBack={() => setSub({ view: "list" })} />;
  }
  if (sub.view === "claim-detail") {
    return <ClaimDetailPanel id={sub.id} fetchWithAuth={fetchWithAuth} onBack={() => setSub({ view: "list" })} />;
  }

  const tabs: { key: typeof tab; label: string; count: number }[] = [
    { key: "prs", label: "PRs", count: prs.length },
    { key: "stock", label: "Stock", count: stocks.length },
    { key: "claims", label: "Claims", count: claims.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <h2 className="font-semibold">My History</h2>
      </div>

      <div className="flex rounded-lg border p-1 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1 text-xs opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
      {listError && <p className="text-sm text-destructive text-center py-4">{listError}</p>}

      {!loading && !listError && (
        <div className="space-y-2">
          {tab === "prs" && (
            prs.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No purchase requests yet.</p>
              : prs.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => setSub({ view: "pr-detail", id: pr.id })}
                    className="w-full text-left rounded-lg border p-3 space-y-1.5 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">{pr.pr_number}</span>
                      <StatusPill status={pr.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Number(pr.total_original).toLocaleString()} {pr.currency}</span>
                      <span>{formatDate(pr.created_at)}</span>
                    </div>
                  </button>
                ))
          )}

          {tab === "stock" && (
            stocks.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No stock requests yet.</p>
              : stocks.map((sr) => (
                  <button
                    key={sr.id}
                    onClick={() => setSub({ view: "stock-detail", id: sr.id })}
                    className="w-full text-left rounded-lg border p-3 space-y-1.5 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{sr.item_name}</p>
                        <p className="text-xs text-muted-foreground">{sr.sku}</p>
                      </div>
                      <StatusPill status={sr.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Qty: {sr.qty}</span>
                      <span>{formatDate(sr.created_at)}</span>
                    </div>
                  </button>
                ))
          )}

          {tab === "claims" && (
            claims.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No claims yet.</p>
              : claims.map((cl) => (
                  <button
                    key={cl.id}
                    onClick={() => setSub({ view: "claim-detail", id: cl.id })}
                    className="w-full text-left rounded-lg border p-3 space-y-1.5 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{cl.item_name}</p>
                        <p className="text-xs text-muted-foreground">{cl.sku}</p>
                      </div>
                      <StatusPill status={cl.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Qty: {cl.qty_claimed}</span>
                      <span>{formatDate(cl.created_at)}</span>
                    </div>
                  </button>
                ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Link Account Form ────────────────────────────────────────────────────────

function LinkForm({
  initData,
  onSuccess,
}: {
  initData: string;
  onSuccess: (profile: Profile, token: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(appUrl("/api/telegram/link-credentials"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData, email, password }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setError(body.error ?? "Failed"); return; }
    onSuccess(body.profile, body.accessToken);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link your account</CardTitle>
        <CardDescription>
          Sign in with your ByteLab credentials to connect this Telegram account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={busy || !email || !password}>
            {busy ? "Signing in…" : "Sign in & link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main Shell ───────────────────────────────────────────────────────────────

export default function MiniAppPage() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [pos, setPos] = useState<PoOption[]>([]);
  const [doneMsg, setDoneMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkInitData, setLinkInitData] = useState<string>("");
  const initDataRef = useRef<string>("");

  function storeToken(t: string) {
    setToken(t);
    tokenRef.current = t;
  }

  // Wraps every miniapp API call: injects the Bearer token and silently
  // re-runs the initData exchange on 401, then retries once.
  const fetchWithAuth = useCallback(async (path: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken = tokenRef.current;
    const headers = { ...(options.headers as Record<string, string>), authorization: `Bearer ${currentToken}` };
    const res = await fetch(appUrl(path), { ...options, headers });
    if (res.status !== 401 || !initDataRef.current) return res;

    // Token expired — try refreshing via stored initData
    try {
      const refreshRes = await fetch(appUrl("/api/telegram/init"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: initDataRef.current }),
      });
      if (!refreshRes.ok) return res;
      const { accessToken } = await refreshRes.json();
      storeToken(accessToken);
      return fetch(appUrl(path), { ...options, headers: { ...headers, authorization: `Bearer ${accessToken}` } });
    } catch {
      return res;
    }
  }, []);

  async function finishAuth(accessToken: string, prof: Profile) {
    setProfile(prof);
    storeToken(accessToken);
    const dataRes = await fetch(appUrl("/api/miniapp/data"), {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (dataRes.ok) {
      const data = await dataRes.json();
      setItems(data.items ?? []);
      setRates(data.rates ?? { USD: 1 });
      setPos(data.pos ?? []);
    }
    setScreen("home");
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      const t = setTimeout(() => {
        if (!window.Telegram?.WebApp) setScreen("no-telegram");
      }, 1200);
      return () => clearTimeout(t);
    }
    tg.ready();
    tg.expand();
    initDataRef.current = tg.initData;

    fetch(appUrl("/api/telegram/init"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 403 && body.error === "telegram account not linked to a user") {
          setLinkInitData(initDataRef.current);
          setScreen("link");
          return;
        }
        if (!res.ok) throw new Error(body.error ?? "auth failed");
        await finishAuth(body.accessToken, body.profile);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "auth failed");
        setScreen("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDone(msg: string) {
    setDoneMsg(msg);
    setScreen("submitted");
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {screen === "loading" && (
        <p className="text-sm text-muted-foreground">Authenticating…</p>
      )}

      {screen === "link" && (
        <LinkForm
          initData={linkInitData}
          onSuccess={(prof, tok) => finishAuth(tok, prof)}
        />
      )}

      {screen === "no-telegram" && (
        <Card>
          <CardHeader>
            <CardTitle>Open in Telegram</CardTitle>
            <CardDescription>This Mini App must be launched from the Telegram bot.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {screen === "error" && (
        <Card>
          <CardHeader>
            <CardTitle>Couldn&apos;t sign in</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {screen === "home" && profile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{profile.full_name ?? "Welcome"}</p>
              <p className="text-xs text-muted-foreground">ByteLab Ops</p>
            </div>
            <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Quick actions</p>
            <Button className="w-full" onClick={() => setScreen("pr-form")}>
              🛒 New Purchase Request
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setScreen("stock-form")}>
              📦 Request Stock
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setScreen("claim-form")}>
              📥 Submit Claim
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">My activity</p>
            <Button className="w-full" variant="outline" onClick={() => setScreen("history")}>
              📋 My History
            </Button>
          </div>
        </div>
      )}

      {screen === "pr-form" && token && (
        <PrForm fetchWithAuth={fetchWithAuth} rates={rates} onBack={() => setScreen("home")} onDone={handleDone} />
      )}

      {screen === "stock-form" && token && (
        <StockForm fetchWithAuth={fetchWithAuth} items={items} onBack={() => setScreen("home")} onDone={handleDone} />
      )}

      {screen === "claim-form" && token && (
        <ClaimForm fetchWithAuth={fetchWithAuth} pos={pos} items={items} onBack={() => setScreen("home")} onDone={handleDone} />
      )}

      {screen === "history" && token && (
        <HistoryView fetchWithAuth={fetchWithAuth} rates={rates} onBack={() => setScreen("home")} />
      )}

      {screen === "submitted" && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Done</CardTitle>
            <CardDescription>{doneMsg}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => setScreen("home")}>
              Back to home
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
