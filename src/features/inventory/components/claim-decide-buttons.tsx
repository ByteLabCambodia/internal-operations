"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { decideClaim } from "@/features/inventory/services/actions";
import { Button } from "@/components/ui/button";

export function ClaimDecideButtons({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "confirmed" | "rejected") {
    setBusy(true);
    const res = await decideClaim({ claim_id: claimId, decision });
    setBusy(false);
    if (res.ok) {
      toast.success(`Claim ${decision}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => decide("confirmed")} disabled={busy}>
        <Check className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => decide("rejected")} disabled={busy}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
