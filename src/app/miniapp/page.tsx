"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

type Screen = "loading" | "no-telegram" | "error" | "home" | "pr-form" | "stock-form" | "submitted";
type Profile = { id: string; full_name: string | null; role: string };
type InventoryItem = { id: string; sku: string; name: string; unit: string };
type Currency = "USD" | "KHR" | "CNY";

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void } };
  }
}

function makeSupabase(accessToken: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    },
  );
}

// ── PR Form ─────────────────────────────────────────────────────────────────

function PrForm({
  profile,
  supabase,
  onBack,
  onDone,
}: {
  profile: Profile;
  supabase: SupabaseClient;
  onBack: () => void;
  onDone: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name || !qty || !price) return;
    setBusy(true);
    setError(null);

    // Fetch today's rate.
    const today = new Date().toISOString().slice(0, 10);
    const { data: rateRow } = await supabase
      .from("exchange_rates")
      .select("rate_to_usd")
      .eq("currency", currency)
      .lte("rate_date", today)
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const rate = currency === "USD" ? 1 : (rateRow?.rate_to_usd ? Number(rateRow.rate_to_usd) : null);
    if (!rate) {
      setError(`No exchange rate found for ${currency}. Ask finance to set today's rate.`);
      setBusy(false);
      return;
    }

    const totalOriginal = Number(qty) * Number(price);

    const { data: pr, error: prErr } = await supabase
      .from("purchase_requests")
      .insert({
        requester_id: profile.id,
        status: "pending",
        currency,
        exchange_rate: rate,
        total_original: totalOriginal,
        note: note || null,
      })
      .select("id")
      .single();

    if (prErr || !pr) {
      setError(prErr?.message ?? "Failed to create request");
      setBusy(false);
      return;
    }

    await supabase.from("purchase_request_items").insert({
      pr_id: pr.id,
      name,
      qty: Number(qty),
      unit_price_original: Number(price),
    });

    // Notify via server (fire-and-forget).
    fetch("/api/miniapp/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "pr_created", pr_id: pr.id, requester_id: profile.id }),
    }).catch(() => {});

    onDone("Purchase request submitted! A manager will review it shortly.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h2 className="text-lg font-semibold">New Purchase Request</h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Item name</Label>
          <Input placeholder="e.g. Arduino Uno R3" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Qty</Label>
            <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Unit price</Label>
            <Input type="number" min="0" step="any" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
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
          <Input placeholder="Link, reason, or details" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" onClick={submit} disabled={busy || !name || !qty || !price}>
          {busy ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </div>
  );
}

// ── Stock Request Form ───────────────────────────────────────────────────────

function StockForm({
  profile,
  supabase,
  onBack,
  onDone,
}: {
  profile: Profile;
  supabase: SupabaseClient;
  onBack: () => void;
  onDone: (msg: string) => void;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("inventory_items")
      .select("id, sku, name, unit")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setItems(data ?? []));
  }, [supabase]);

  async function submit() {
    if (!itemId || !qty) return;
    setBusy(true);
    setError(null);

    const { error: err } = await supabase.from("stock_requests").insert({
      requester_id: profile.id,
      inventory_item_id: itemId,
      qty: Number(qty),
      status: "pending",
      note: note || null,
    });

    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }

    onDone("Stock request submitted! A manager will fulfil it shortly.");
  }

  const selected = items.find((i) => i.id === itemId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h2 className="text-lg font-semibold">New Stock Request</h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Item</Label>
          <Select value={itemId} onValueChange={(v) => setItemId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select item">
                {selected ? `${selected.sku} · ${selected.name}` : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {items.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.sku} · {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Qty {selected ? `(${selected.unit})` : ""}</Label>
          <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Note (optional)</Label>
          <Input placeholder="What it's for" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" onClick={submit} disabled={busy || !itemId || !qty}>
          {busy ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </div>
  );
}

// ── Main Shell ───────────────────────────────────────────────────────────────

export default function MiniAppPage() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
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

    fetch("/api/telegram/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "auth failed");
        setProfile(body.profile);
        setAccessToken(body.accessToken);
        setScreen("home");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "auth failed");
        setScreen("error");
      });
  }, []);

  const supabase = accessToken ? makeSupabase(accessToken) : null;

  function handleDone(msg: string) {
    setDoneMsg(msg);
    setScreen("submitted");
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
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
            </div>
          </div>
        )}

        {screen === "pr-form" && profile && supabase && (
          <PrForm
            profile={profile}
            supabase={supabase}
            onBack={() => setScreen("home")}
            onDone={handleDone}
          />
        )}

        {screen === "stock-form" && profile && supabase && (
          <StockForm
            profile={profile}
            supabase={supabase}
            onBack={() => setScreen("home")}
            onDone={handleDone}
          />
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
    </>
  );
}
