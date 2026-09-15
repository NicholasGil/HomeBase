"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { askConcierge } from "@/app/actions/concierge";
import { ConciergeAnswerView } from "@/components/concierge-answer";
import { Button } from "@/components/ui/button";

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
}: {
  className?: string;
  starters?: readonly string[];
  idleHint?: string;
  questionPlaceholder?: string;
  scrollIntro?: ReactNode;
  pinStartersAboveScrollOnMobile?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstSessionThreadRef = useRef<HTMLDivElement>(null);

  const pinFirstSessionMobile = pinStartersAboveScrollOnMobile;
  const showPinnedFirstSessionThread =
    pinFirstSessionMobile && asked !== null;
  const mobileReplyGrid =
    pinFirstSessionMobile && showPinnedFirstSessionThread;

  useEffect(() => {
    if (answer === null || !showPinnedFirstSessionThread) {
      return;
    }
    firstSessionThreadRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [answer, showPinnedFirstSessionThread]);

  async function submit(nextQuestion: string) {
    setBusy(true);
    setAsked(nextQuestion);
    setAnswer(null);
    const result = await askConcierge({ question: nextQuestion });
    if (!result.ok) {
      setAnswer("You cannot ask the concierge.");
      setKind("refuse");
    } else {
      setAnswer(result.answer.text);
      setKind(result.answer.kind);
    }
    setBusy(false);
  }

  const compactFirstSessionAnswer =
    "max-md:line-clamp-3 max-md:overflow-hidden max-md:px-3 max-md:py-1 max-md:text-xs max-md:leading-snug";

  function renderConversation(options?: { omitUserBubble?: boolean }) {
    const omitUserBubble = options?.omitUserBubble === true;
    return (
      <>
        {asked === null ? (
          <p className="my-auto text-center text-sm text-muted-foreground">
            {idleHint}
          </p>
        ) : omitUserBubble ? null : (
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {asked}
          </p>
        )}
        {busy ? (
          <p className="text-sm text-muted-foreground">Checking this file…</p>
        ) : null}
        {answer !== null ? (
          <ConciergeAnswerView
            text={answer}
            kind={kind}
            className={
              omitUserBubble ? compactFirstSessionAnswer : undefined
            }
          />
        ) : null}
      </>
    );
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
      className={cn(
        "flex min-h-0 flex-col",
        mobileReplyGrid &&
          "max-md:grid max-md:min-h-0 max-md:flex-1 max-md:grid-rows-[auto_minmax(0,1fr)_auto] max-md:gap-4",
        className,
      )}
    >
      {pinFirstSessionMobile ? (
        <div
          className={cn(
            "shrink-0 max-md:block md:hidden",
            mobileReplyGrid && "max-md:row-start-1",
            showPinnedFirstSessionThread ? "pt-2 pb-0" : "pt-4 pb-1",
          )}
        >
          {starterChips}
        </div>
      ) : null}
      {showPinnedFirstSessionThread ? (
        <div
          ref={firstSessionThreadRef}
          aria-live="polite"
          data-testid="concierge-first-session-thread"
          className="flex min-h-0 flex-col gap-0 overflow-y-auto overflow-x-hidden py-0.5 max-md:row-start-2 max-md:block md:hidden"
        >
          {renderConversation({ omitUserBubble: true })}
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4",
          "max-md:pb-[var(--coach-compose-inset)]",
          pinFirstSessionMobile && "max-md:pt-0",
          showPinnedFirstSessionThread && "max-md:hidden",
        )}
      >
        <div className={cn(pinFirstSessionMobile && "max-md:hidden")}>
          {starterChips}
        </div>

        {scrollIntro && !(pinFirstSessionMobile && asked !== null) ? (
          <div className="shrink-0">{scrollIntro}</div>
        ) : null}

        <div
          aria-live={showPinnedFirstSessionThread ? "off" : "polite"}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          {showPinnedFirstSessionThread ? (
            <div className="hidden min-h-0 flex-1 flex-col gap-3 md:flex">
              {renderConversation()}
            </div>
          ) : (
            renderConversation()
          )}
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 md:static",
          mobileReplyGrid
            ? "max-md:row-start-3 max-md:-mx-5 max-md:px-5 max-md:pb-[env(safe-area-inset-bottom)]"
            : "max-md:sticky max-md:z-10 max-md:-mx-5 max-md:bottom-[var(--coach-compose-clearance)] max-md:px-5 max-md:pb-[env(safe-area-inset-bottom)]",
        )}
        data-testid="concierge-compose"
      >
        <form
          className={cn(
            "flex gap-2 border-t border-border/70 bg-card/95 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.14)] backdrop-blur md:bg-card md:shadow-none md:backdrop-blur-none",
            mobileReplyGrid ? "pt-2" : "pt-3",
          )}
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
