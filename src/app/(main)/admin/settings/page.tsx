import Link from "next/link";

import { requirePermission } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/reui/badge";
import { currencySchema, PAYMENT_METHOD_LABELS } from "@/features/procurement/schemas";

export default async function AdminSettingsPage() {
  await requirePermission("users.manage");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Currencies & FX</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {currencySchema.options.map((c) => (
              <Badge key={c} variant="secondary">{c}</Badge>
            ))}
          </div>
          <p className="text-muted-foreground">
            Exchange rates are set manually under{" "}
            <Link href="/accounting" className="underline underline-offset-2">Accounting</Link>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment methods</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.values(PAYMENT_METHOD_LABELS).map((label) => (
              <Badge key={label} variant="secondary">{label}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>System</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Configurable system settings (Telegram bot, default department, notification
          preferences) will live here.
        </CardContent>
      </Card>
    </div>
  );
}
