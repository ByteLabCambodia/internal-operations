"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Telegram Mini App shell. On load it reads Telegram `initData`, exchanges it at
 * /api/telegram/init for a Supabase-compatible token, and shows the signed-in
 * user. Data views build on this handshake (the token is used as a Bearer for
 * Supabase REST so RLS applies). Mobile-first; uses Telegram theme params.
 */

type Profile = { id: string; full_name: string | null; role: string };

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void } };
  }
}

export default function MiniAppPage() {
  const [state, setState] = useState<"loading" | "ready" | "error" | "no-telegram">("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      // Script may still be loading; retry briefly.
      const t = setTimeout(() => {
        if (!window.Telegram?.WebApp) setState("no-telegram");
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
        // body.accessToken can be used as a Supabase Bearer token for data views.
        setState("ready");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "auth failed");
        setState("error");
      });
  }, []);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div className="mx-auto max-w-md space-y-4 p-4">
        <h1 className="text-xl font-semibold tracking-tight">ByteLab Ops</h1>

        {state === "loading" && <p className="text-sm text-muted-foreground">Authenticating…</p>}

        {state === "no-telegram" && (
          <Card>
            <CardHeader>
              <CardTitle>Open in Telegram</CardTitle>
              <CardDescription>
                This Mini App must be launched from the Telegram bot. For browser access, use the
                web app sign-in instead.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {state === "error" && (
          <Card>
            <CardHeader>
              <CardTitle>Couldn&apos;t sign in</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {state === "ready" && profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {profile.full_name ?? "Welcome"}
                <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
              </CardTitle>
              <CardDescription>You&apos;re signed in via Telegram.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Quick actions and your pending items appear here.
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
