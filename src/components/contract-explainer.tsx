import { askAboutSectionFromForm } from "@/app/actions/explainer";
import { AccessDeniedCard } from "@/components/access-denied-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FixtureAgentThread } from "@/lib/explainer-access";
import type { ContractSection } from "../../convex/lib/explainContract";
import { tripHeadingClassName } from "@/lib/trip-ui";

export function ContractExplainer({
  sections,
  thread,
  denied,
}: {
  sections: ContractSection[];
  thread: FixtureAgentThread;
  denied?: boolean;
}) {
  if (denied) {
    return (
      <AccessDeniedCard
        testId="explainer-denied"
        title="You cannot open this explainer."
      />
    );
  }

  return (
    <section className="space-y-4" data-testid="contract-explainer">
      <div>
        <h2 className={tripHeadingClassName}>
          Contract explainer
        </h2>
        <p className="text-sm text-muted-foreground">
          Describes what each sample section states. It does not draft language
          or say whether a clause is enforceable.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card
            key={section.id}
            data-testid={`explainer-section-${section.id}`}
          >
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.source}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{section.description}</p>
              <form action={askAboutSectionFromForm}>
                <input type="hidden" name="sectionId" value={section.id} />
                <Button
                  type="submit"
                  variant="outline"
                  data-testid={`ask-agent-${section.id}`}
                >
                  {section.askAgent}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card data-testid="agent-thread">
        <CardHeader>
          <CardTitle>Routed to your licensee</CardTitle>
          <CardDescription>
            Ask my agent uses the existing concierge thread.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {thread.turns.length === 0 ? (
            <p className="text-muted-foreground">No section has been sent yet.</p>
          ) : (
            thread.turns.map((turn) => (
              <div key={`${turn.sectionId}-${turn.question}`}>
                <Badge variant="outline">{turn.sectionTitle}</Badge>
                <p data-testid={`agent-thread-${turn.sectionId}`}>
                  {turn.question}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
