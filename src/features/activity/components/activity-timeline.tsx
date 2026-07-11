import { createClient } from "@/lib/supabase/server";
import type { ActivityAction, ActivityEntityType } from "@/lib/activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
} from "@/components/reui/timeline";

const LABELS: Record<ActivityAction, string> = {
  created: "created this",
  submitted: "submitted this",
  approved: "approved this",
  rejected: "rejected this",
  converted: "converted this to a PO",
  cancelled: "cancelled this",
  payment_recorded: "recorded a payment",
  fulfilled: "fulfilled this",
};

/** Up to two uppercase initials from a display name. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  const list = events ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No activity recorded.</p>
        ) : (
          <Timeline value={list.length}>
            {list.map((e, i) => {
              const label = LABELS[e.action as ActivityAction] ?? e.action.replace(/_/g, " ");
              const actor =
                (e.actor as unknown as { full_name: string | null } | null)?.full_name ?? "Someone";
              const note = (e.detail as { note?: string } | null)?.note;

              return (
                <TimelineItem
                  key={e.id}
                  step={i + 1}
                  className="group-data-[orientation=vertical]/timeline:ms-10"
                >
                  <TimelineHeader>
                    <TimelineSeparator className="bg-input! group-data-[orientation=vertical]/timeline:top-2 group-data-[orientation=vertical]/timeline:-left-8 group-data-[orientation=vertical]/timeline:h-[calc(100%-2.5rem)] group-data-[orientation=vertical]/timeline:translate-y-7" />
                    <TimelineIndicator className="grid size-8 place-items-center overflow-hidden rounded-full border-none bg-primary/10 text-[10px] font-medium text-primary group-data-[orientation=vertical]/timeline:-left-8">
                      {initials(actor)}
                    </TimelineIndicator>
                  </TimelineHeader>
                  <TimelineContent>
                    <p className="text-sm">
                      <span className="font-medium text-foreground">{actor}</span>{" "}
                      <span className="text-muted-foreground">{label}</span>
                    </p>
                    <TimelineDate className="mt-0.5 mb-0">
                      {new Date(e.created_at).toLocaleString()}
                    </TimelineDate>
                    {note && (
                      <p className="mt-1 text-sm text-muted-foreground">&quot;{note}&quot;</p>
                    )}
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}
