"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { updatePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={async (e: React.SubmitEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (password !== confirm) {
              setError("Passwords do not match");
              return;
            }
            setLoading(true);
            setError(null);
            const params = new URLSearchParams(window.location.search);
            const tokenHash = params.get("token_hash") ?? "";
            const type = (params.get("type") ?? "recovery") as EmailOtpType;
            const result = await updatePassword(tokenHash, type, password);
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
            } else {
              router.push("/dashboard");
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              required
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading || !password || !confirm}>
            {loading ? "Saving…" : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
