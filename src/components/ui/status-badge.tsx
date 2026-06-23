import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "destructive" | "outline";

const MAP: Record<string, Variant> = {
  // pr
  draft: "outline",
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  cancelled: "outline",
  // po
  open: "secondary",
  partial: "secondary",
  complete: "default",
  // payment
  unpaid: "destructive",
  paid: "default",
  // claim / stock request
  confirmed: "default",
  fulfilled: "default",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={MAP[status] ?? "outline"} className="capitalize">
      {status}
    </Badge>
  );
}
