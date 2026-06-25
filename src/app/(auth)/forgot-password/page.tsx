"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <p className="text-sm text-muted-foreground">
            If <span className="font-medium text-foreground">{email}</span> has an account, a reset
            link has been sent.
          </p>
        ) : (
          <form
            onSubmit={async (e: React.SubmitEvent<HTMLFormElement>) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              const supabase = createClient();
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
              });
              setLoading(false);
              if (error) {
                setError(error.message);
              } else {
                setSent(true);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@bytelab.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <a href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
              Back to sign in
            </a>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
