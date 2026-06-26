import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  CreditCard,
  Warehouse,
  Circle,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { ActivityAction, ActivityEntityType } from "@/lib/activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const META: Record<ActivityAction, { label: string; icon: LucideIcon; className: string }> = {
  created: { label: "Created", icon: ClipboardList, className: "text-blue-600" },
  submitted: { label: "Submitted", icon: ClipboardList, className: "text-blue-600" },
  approved: { label: "Approved", icon: CheckCircle2, className: "text-emerald-600" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-red-600" },
  converted: { label: "Converted to PO", icon: ShoppingCart, className: "text-blue-600" },
  payment_recorded: { label: "Payment recorded", icon: CreditCard, className: "text-emerald-600" },
  fulfilled: { label: "Fulfilled", icon: Warehouse, className: "text-emerald-600" },
};

function fallback(action: string) {
  return { label: action.replace(/_/g, " "), icon: Circle, className: "text-muted-foreground" };
}

/**
 * Per-record audit timeline. Server component: fetches the entity's events
 * (RLS scopes visibility) joined with the actor's name and renders them oldest
 * first. Drop into any detail page with the entity type and id.
 */
export async function ActivityTimeline({
  entityType,
  entityId,
}: {
  entityType: ActivityEntityType;
  entityId: string;
}) {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("activity_events")
    .select("id, action, detail, created_at, actor:profiles(full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {(events ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No activity recorded.</p>
        ) : (
          <ol className="relative space-y-5 border-l pl-6">
            {(events ?? []).map((e) => {
              const meta = META[e.action as ActivityAction] ?? fallback(e.action);
              const Icon = meta.icon;
              const actor =
                (e.actor as unknown as { full_name: string | null } | null)?.full_name ?? "Someone";
              const note = (e.detail as { note?: string } | null)?.note;
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full bg-background">
                    <Icon className={`size-4 ${meta.className}`} />
                  </span>
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {actor} · {new Date(e.created_at).toLocaleString()}
                  </p>
                  {note && <p className="mt-1 text-sm text-muted-foreground">“{note}”</p>}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
