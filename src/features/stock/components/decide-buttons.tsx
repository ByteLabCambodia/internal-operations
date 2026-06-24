"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { decideStockRequest } from "@/features/stock/services/actions";
import { Button } from "@/components/ui/button";

export function StockDecideButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "fulfilled" | "rejected") {
    setBusy(true);
    const res = await decideStockRequest({ request_id: requestId, decision });
    setBusy(false);
    if (res.ok) {
      toast.success(`Request ${decision}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => decide("fulfilled")} disabled={busy}>
        <Check className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => decide("rejected")} disabled={busy}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
