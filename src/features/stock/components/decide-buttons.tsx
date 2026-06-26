"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, PackageCheck, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { decideStockRequest } from "@/features/stock/services/actions";
import { Button } from "@/components/ui/button";

type Decision = "approved" | "fulfilled" | "rejected";

/**
 * Pending requests can be approved or rejected; approved requests can be
 * fulfilled (decrements stock) or rejected.
 */
export function StockDecideButtons({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: Decision) {
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
      {status === "pending" && (
        <Button size="sm" variant="ghost" title="Approve" onClick={() => decide("approved")} disabled={busy}>
          <ThumbsUp className="size-4" />
        </Button>
      )}
      {(status === "pending" || status === "approved") && (
        <Button size="sm" variant="ghost" title="Fulfil" onClick={() => decide("fulfilled")} disabled={busy}>
          <PackageCheck className="size-4" />
        </Button>
      )}
      <Button size="sm" variant="ghost" title="Reject" onClick={() => decide("rejected")} disabled={busy}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
