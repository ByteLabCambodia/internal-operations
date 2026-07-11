"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelPurchaseRequest, cancelPurchaseOrder } from "@/features/procurement/services/actions";

export function CancelButton({
  type,
  id,
}: {
  type: "pr" | "po";
  id: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm(`Cancel this ${type === "pr" ? "purchase request" : "purchase order"}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = type === "pr"
        ? await cancelPurchaseRequest(id)
        : await cancelPurchaseOrder(id);
      if (!result.ok) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={pending} onClick={handleClick}>
      {pending ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
