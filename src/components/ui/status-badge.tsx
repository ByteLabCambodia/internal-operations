import { Badge, type BadgeProps } from "@/components/reui/badge";

type Variant = BadgeProps["variant"];

const MAP: Record<string, Variant> = {
  // pr
  draft: "outline",
  pending: "warning-light",
  approved: "success-light",
  rejected: "destructive-light",
  cancelled: "outline",
  converted: "secondary",
  // po
  open: "info-light",
  partial: "warning-light",
  complete: "success-light",
  // payment
  unpaid: "destructive-light",
  paid: "success-light",
  // claim / stock request
  confirmed: "success-light",
  fulfilled: "success-light",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={MAP[status] ?? "outline"} className="capitalize">
      {status}
    </Badge>
  );
}
