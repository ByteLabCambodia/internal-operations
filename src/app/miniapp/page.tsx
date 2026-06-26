"use client";

import { useEffect, useState } from "react";

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

type Screen = "loading" | "no-telegram" | "error" | "home" | "pr-form" | "stock-form" | "claim-form" | "submitted";
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
  token,
  rates,
  onBack,
  onDone,
}: {
  token: string;
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

    const res = await fetch(appUrl("/api/miniapp/pr"), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
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
  token,
  items,
  onBack,
  onDone,
}: {
  token: string;
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

    const res = await fetch(appUrl("/api/miniapp/stock"), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
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
  token,
  pos,
  items,
  onBack,
  onDone,
}: {
  token: string;
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

    const res = await fetch(appUrl("/api/miniapp/claim"), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
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

// ── Main Shell ───────────────────────────────────────────────────────────────

export default function MiniAppPage() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [pos, setPos] = useState<PoOption[]>([]);
  const [doneMsg, setDoneMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

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

    fetch(appUrl("/api/telegram/init"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "auth failed");
        setProfile(body.profile);
        setToken(body.accessToken);

        // Pre-fetch inventory items + rates for the forms.
        const dataRes = await fetch(appUrl("/api/miniapp/data"), {
          headers: { authorization: `Bearer ${body.accessToken}` },
        });
        if (dataRes.ok) {
          const data = await dataRes.json();
          setItems(data.items ?? []);
          setRates(data.rates ?? { USD: 1 });
          setPos(data.pos ?? []);
        }

        setScreen("home");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "auth failed");
        setScreen("error");
      });
  }, []);

  function handleDone(msg: string) {
    setDoneMsg(msg);
    setScreen("submitted");
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {screen === "loading" && (
        <p className="text-sm text-muted-foreground">Authenticating…</p>
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
        </div>
      )}

      {screen === "pr-form" && token && (
        <PrForm token={token} rates={rates} onBack={() => setScreen("home")} onDone={handleDone} />
      )}

      {screen === "stock-form" && token && (
        <StockForm token={token} items={items} onBack={() => setScreen("home")} onDone={handleDone} />
      )}

      {screen === "claim-form" && token && (
        <ClaimForm token={token} pos={pos} items={items} onBack={() => setScreen("home")} onDone={handleDone} />
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
