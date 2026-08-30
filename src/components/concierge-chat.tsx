"use client";

import { useState } from "react";

import { askSeedConcierge } from "@/app/actions/concierge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STARTERS = [
  "What happens next?",
  "When is my inspection?",
  "What am I missing?",
  "How much cash will I need?",
  "What did the inspection find?",
  "What changed in the counteroffer?",
  "Who is my lender?",
  "When do I leave for my first showing?",
];

export function ConciergeChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(nextQuestion: string) {
    setBusy(true);
    setAnswer(null);
    const result = await askSeedConcierge({ question: nextQuestion });
    if (!result.ok) {
      setAnswer("You cannot ask the concierge.");
      setKind("refuse");
    } else {
      setAnswer(result.answer.text);
      setKind(result.answer.kind);
    }
    setBusy(false);
  }

  return (
    <Card data-testid="concierge">
      <CardHeader>
        <CardTitle>Transaction concierge</CardTitle>
        <CardDescription>
          Explains this file only. Ask my agent for strategy, price, or legal
          meaning.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((starter) => (
            <Button
              key={starter}
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                setQuestion(starter);
                void submit(starter);
              }}
            >
              {starter}
            </Button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(question);
          }}
        >
          <input
            data-testid="concierge-question"
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about this transaction"
          />
          <Button
            type="submit"
            data-testid="concierge-ask"
            disabled={busy || question.trim().length === 0}
          >
            Ask
          </Button>
        </form>
        {answer !== null ? (
          <p data-testid="concierge-answer" data-kind={kind ?? undefined}>
            {answer}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
