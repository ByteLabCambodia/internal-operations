"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { decidePurchaseRequest } from "@/features/procurement/services/actions";
import { Button } from "@/components/ui/button";

export function DecideButtons({ prId }: { prId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    const res = await decidePurchaseRequest({ pr_id: prId, decision });
    setBusy(false);
    if (res.ok) {
      toast.success(`Request ${decision}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => decide("approved")} disabled={busy} className="gap-2">
        <Check className="size-4" /> Approve
      </Button>
      <Button onClick={() => decide("rejected")} disabled={busy} variant="destructive" className="gap-2">
        <X className="size-4" /> Reject
      </Button>
    </div>
  );
}
