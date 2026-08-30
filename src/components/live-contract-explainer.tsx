"use client";

import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

export function LiveContractExplainer() {
  const mine = useQuery(api.explainer.listMine, {});
  const thread = useQuery(
    api.concierge.listThread,
    mine ? { transactionId: mine.transactionId } : "skip",
  );
  const askAboutSection = useMutation(api.explainer.askAboutSection);

  if (mine === undefined) {
    return (
      <p className="text-sm text-muted-foreground">Loading explainer…</p>
    );
  }
  if (mine === null) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="explainer-denied">
        You cannot open this explainer.
      </p>
    );
  }

  return (
    <section className="space-y-4" data-testid="contract-explainer">
      <h2 className="text-xl font-semibold tracking-tight">
        Contract explainer
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {mine.sections.map((section) => (
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
              <Button
                type="button"
                variant="outline"
                data-testid={`ask-agent-${section.id}`}
                onClick={() => {
                  void askAboutSection({
                    transactionId: mine.transactionId,
                    sectionId: section.id,
                  });
                }}
              >
                {section.askAgent}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card data-testid="agent-thread">
        <CardHeader>
          <CardTitle>Routed to your licensee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(thread ?? []).map((message) => (
            <p key={`${message.at}-${message.content}`}>
              <Badge variant="outline">{message.role}</Badge> {message.content}
            </p>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
