"use client";

import { useState, type ReactNode } from "react";

import { askConcierge } from "@/app/actions/concierge";
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

export function ConciergeChat({
  className,
  starters = CONCIERGE_STARTERS,
  idleHint = "Pick a question above or ask about this transaction. I explain what is on this file; I do not advise.",
  questionPlaceholder = "Ask about this transaction",
  /** Renders inside the scroll region (e.g. first-session empty state). */
  scrollIntro,
  /** Keep starters fixed above the scroll area on 375 so the fold shows chips + Ask. */
  pinStartersAboveScrollOnMobile = false,
  /** Discovery coach with no property on file — scoped explain-only facts. */
  discoveryEmpty = false,
}: {
  className?: string;
  starters?: readonly string[];
  idleHint?: string;
  questionPlaceholder?: string;
  scrollIntro?: ReactNode;
  pinStartersAboveScrollOnMobile?: boolean;
  discoveryEmpty?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(nextQuestion: string) {
    setBusy(true);
    setAsked(nextQuestion);
    setAnswer(null);
    const result = await askConcierge({
      question: nextQuestion,
      discoveryEmpty,
    });
    if (!result.ok) {
      setAnswer("You cannot ask the concierge.");
      setKind("refuse");
    } else {
      setAnswer(result.answer.text);
      setKind(result.answer.kind);
    }
    setBusy(false);
  }

  const starterChips = (
    <div
      aria-label="Suggested questions"
      className="-mx-5 flex flex-wrap gap-2 px-5 pb-1 md:mx-0"
    >
      {starters.map((starter) => (
        <Button
          key={starter}
          type="button"
          variant="secondary"
          className="h-auto min-h-11 w-max max-w-[min(17.5rem,calc(100vw-3rem))] shrink-0 rounded-full bg-sage px-4 py-2 text-left text-sm whitespace-normal text-sage-foreground hover:bg-sage/80"
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
  );

  return (
    <section
      data-testid="concierge"
      aria-label="Transaction concierge"
      className={cn("flex min-h-0 flex-col", className)}
    >
      {pinStartersAboveScrollOnMobile ? (
        <div className="shrink-0 pt-4 pb-1 max-md:block md:hidden">
          {starterChips}
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4",
          "max-md:pb-[var(--coach-compose-inset)]",
          pinStartersAboveScrollOnMobile && "max-md:pt-0",
        )}
      >
        <div
          className={cn(
            pinStartersAboveScrollOnMobile && "max-md:hidden",
          )}
        >
          {starterChips}
        </div>

        {scrollIntro ? <div className="shrink-0">{scrollIntro}</div> : null}

        <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3">
          {asked === null ? (
            <p className="my-auto text-center text-sm text-muted-foreground">
              {idleHint}
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
      </div>

      <div
        className="shrink-0 max-md:sticky max-md:z-10 max-md:-mx-5 max-md:bottom-[var(--coach-compose-clearance)] max-md:px-5 max-md:pb-[env(safe-area-inset-bottom)] md:static"
        data-testid="concierge-compose"
      >
        <form
          className="flex gap-2 border-t border-border/70 bg-card/95 pt-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.14)] backdrop-blur md:bg-card md:shadow-none md:backdrop-blur-none"
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
            placeholder={questionPlaceholder}
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
      </div>
    </section>
  );
}
