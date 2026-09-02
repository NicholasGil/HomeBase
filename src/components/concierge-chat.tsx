"use client";

import { useState } from "react";

import { askSeedConcierge } from "@/app/actions/concierge";
import { ConciergeAnswerView } from "@/components/concierge-answer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The eight canonical questions from DESIGN.md §M3, phrased the way a buyer
 * would tap them. lib/llm matches on the lowercase fragments, so the copy here
 * can carry punctuation and casing without touching the matcher.
 */
export const CONCIERGE_STARTERS = [
  "What happens next?",
  "When is my inspection?",
  "What am I missing?",
  "How much cash will I need?",
  "What did the inspection find?",
  "What changed in the counteroffer?",
  "Who is my lender?",
  "When do I leave for my first showing?",
] as const;

export function ConciergeChat({ className }: { className?: string }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(nextQuestion: string) {
    setBusy(true);
    setAsked(nextQuestion);
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
    <section
      data-testid="concierge"
      aria-label="Transaction concierge"
      className={cn("flex min-h-0 flex-col", className)}
    >
      <div
        aria-label="Suggested questions"
        className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1"
      >
        {CONCIERGE_STARTERS.map((starter) => (
          <Button
            key={starter}
            type="button"
            variant="secondary"
            className="h-11 shrink-0 snap-start rounded-full bg-sage px-4 text-sm text-sage-foreground hover:bg-sage/80"
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

      <div
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4"
      >
        {asked === null ? (
          <p className="my-auto text-center text-sm text-muted-foreground">
            Pick a question above or ask about this transaction. I explain what
            is on this file; I do not advise.
          </p>
        ) : (
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {asked}
          </p>
        )}
        {busy ? (
          <p className="text-sm text-muted-foreground">Checking this file…</p>
        ) : null}
        {answer !== null ? (
          <ConciergeAnswerView text={answer} kind={kind} />
        ) : null}
      </div>

      <form
        className="flex gap-2 border-t border-border/70 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(question);
        }}
      >
        <input
          data-testid="concierge-question"
          className="min-h-11 min-w-0 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this transaction"
        />
        <Button
          type="submit"
          data-testid="concierge-ask"
          className="h-11 rounded-full px-5"
          disabled={busy || question.trim().length === 0}
        >
          Ask
        </Button>
      </form>
    </section>
  );
}
