import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Generic placeholder for sections whose UI is built in a later phase.
 * Keeps the navigation shell functional during Phase 0.
 */
export function PagePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in {phase}</CardTitle>
          <CardDescription>
            This screen is part of the phased build. The scaffold and navigation are in
            place; functionality lands in {phase}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          See <code>CLAUDE_CODE_BRIEF.md</code> for the full specification.
        </CardContent>
      </Card>
    </div>
  );
}
