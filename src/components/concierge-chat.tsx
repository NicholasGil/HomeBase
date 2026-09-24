"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { askConcierge } from "@/app/actions/concierge";
import { ConciergeAnswerView } from "@/components/concierge-answer";
import { ConciergeUnavailableState } from "@/components/concierge-unavailable";
import { Button } from "@/components/ui/button";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import type { CoachConciergeTurn } from "@/lib/coach-session-storage";
import { CONCIERGE_MODEL_UNAVAILABLE_ANSWER } from "../../lib/llm/types";

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

const CHIP_DISABLED_REASON =
  "AI coach unavailable — model key not configured on this deployment.";

/** Mobile coach card: Ask docked to the concierge footer; pass hits through the shell. */
const MOBILE_COMPOSE_DOCK =
  "max-md:absolute max-md:inset-x-0 max-md:bottom-2 max-md:z-10 max-md:-mx-5 max-md:px-5 max-md:pb-[env(safe-area-inset-bottom)] max-md:pointer-events-none [&_input]:pointer-events-auto [&_button]:pointer-events-auto";

const MOBILE_COMPOSE_GRID =
  "max-md:row-start-3 max-md:-mx-5 max-md:px-5 max-md:pb-[env(safe-area-inset-bottom)]";

export function ConciergeChat({
  className,
  starters = CONCIERGE_STARTERS,
  idleHint = "Pick a question above or ask about this transaction. I explain what is on this file; I do not advise.",
  questionPlaceholder = "Ask about this transaction",
  availability = "ready",
  /** Renders inside the scroll region (e.g. first-session empty state). */
  scrollIntro,
  /** Keep starters fixed above the scroll area on 375 so the fold shows chips + Ask. */
  pinStartersAboveScrollOnMobile = false,
  showAgentLinkWhenUnavailable = true,
  initialThread = [],
  onThreadChange,
  queuedQuestion = null,
  onQueuedQuestionConsumed,
}: {
  className?: string;
  starters?: readonly string[];
  idleHint?: string;
  questionPlaceholder?: string;
  availability?: ConciergeAvailability;
  scrollIntro?: ReactNode;
  pinStartersAboveScrollOnMobile?: boolean;
  showAgentLinkWhenUnavailable?: boolean;
  initialThread?: CoachConciergeTurn[];
  onThreadChange?: (turns: CoachConciergeTurn[]) => void;
  queuedQuestion?: string | null;
  onQueuedQuestionConsumed?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<CoachConciergeTurn[]>(() => [
    ...initialThread,
  ]);
  const [inFlightQuestion, setInFlightQuestion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstSessionThreadRef = useRef<HTMLDivElement>(null);

  const coachUnavailable = availability === "model_key_missing";
  const pinFirstSessionMobile = pinStartersAboveScrollOnMobile;
  const hasConversation = turns.length > 0 || inFlightQuestion !== null;
  const showPinnedFirstSessionThread =
    pinFirstSessionMobile && hasConversation && !coachUnavailable;
  const mobileReplyGrid =
    pinFirstSessionMobile && showPinnedFirstSessionThread;

  useEffect(() => {
    if (queuedQuestion === null || queuedQuestion.trim().length === 0) {
      return;
    }
    const next = queuedQuestion;
    onQueuedQuestionConsumed?.();
    void submit(next);
    // submit is intentionally omitted — one-shot external ask per queuedQuestion change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedQuestion, onQueuedQuestionConsumed]);

  useEffect(() => {
    if (!showPinnedFirstSessionThread || turns.length === 0) {
      return;
    }
    firstSessionThreadRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [turns.length, showPinnedFirstSessionThread]);

  function unavailableTurn(question: string): CoachConciergeTurn {
    return {
      question,
      answer: CONCIERGE_MODEL_UNAVAILABLE_ANSWER.text,
      kind: CONCIERGE_MODEL_UNAVAILABLE_ANSWER.kind,
    };
  }

  async function submit(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (trimmed.length === 0) {
      return;
    }
    if (coachUnavailable) {
      setInFlightQuestion(trimmed);
      setTurns((prev) => {
        const next = [...prev, unavailableTurn(trimmed)];
        onThreadChange?.(next);
        return next;
      });
      setInFlightQuestion(null);
      setQuestion("");
      return;
    }
    setBusy(true);
    setInFlightQuestion(trimmed);
    setQuestion("");
    const result = await askConcierge({ question: trimmed });
    let completed: CoachConciergeTurn;
    if (!result.ok) {
      if (result.reason === "MODEL_KEY_NOT_CONFIGURED") {
        completed = unavailableTurn(trimmed);
      } else {
        completed = {
          question: trimmed,
          answer: "You cannot ask the concierge.",
          kind: "refuse",
        };
      }
    } else {
      completed = {
        question: trimmed,
        answer: result.answer.text,
        kind: result.answer.kind,
      };
    }
    setTurns((prev) => {
      const next = [...prev, completed];
      onThreadChange?.(next);
      return next;
    });
    setInFlightQuestion(null);
    setBusy(false);
  }

  const compactFirstSessionAnswer =
    "max-md:text-small max-md:leading-snug";

  function renderConversation(options?: { omitUserBubble?: boolean }) {
    const omitUserBubble = options?.omitUserBubble === true;
    const lastIndex = turns.length - 1;
    return (
      <>
        {coachUnavailable && !hasConversation ? (
          <ConciergeUnavailableState
            showAgentLink={showAgentLinkWhenUnavailable}
            className="my-auto"
          />
        ) : null}
        {!coachUnavailable && !hasConversation ? (
          <p className="my-auto text-center text-sm text-muted-foreground">
            {idleHint}
          </p>
        ) : null}
        {turns.map((turn, index) => {
          const hideUser =
            omitUserBubble && index === lastIndex && inFlightQuestion === null;
          return (
            <div
              key={`${turn.question}-${index}`}
              className="flex flex-col gap-3"
              data-testid={
                index === lastIndex ? "concierge-thread-turn" : undefined
              }
            >
              {!hideUser ? (
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {turn.question}
                </p>
              ) : null}
              <ConciergeAnswerView
                text={turn.answer}
                kind={turn.kind}
                className={
                  hideUser ? compactFirstSessionAnswer : undefined
                }
              />
            </div>
          );
        })}
        {inFlightQuestion !== null && busy ? (
          <>
            <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {inFlightQuestion}
            </p>
            <p className="text-sm text-muted-foreground">Checking this file…</p>
          </>
        ) : null}
      </>
    );
  }

  const unavailableCompose = (
    <div
      className={cn("shrink-0 md:static", MOBILE_COMPOSE_DOCK)}
      data-testid="concierge-compose"
    >
      <div
        className="flex gap-2 border-t border-border/70 bg-card/95 pt-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.14)] backdrop-blur pointer-events-none md:bg-card md:shadow-none md:backdrop-blur-none md:pointer-events-auto [&_button]:pointer-events-auto"
        aria-hidden
      >
        <div
          className="min-h-11 min-w-0 flex-1 rounded-full border border-dashed border-border/80 bg-muted/40 px-4 text-sm text-muted-foreground pointer-events-none"
        />
        <Button
          type="button"
          data-testid="concierge-ask"
          className="pointer-events-auto h-11 rounded-full px-5"
          disabled
          title={CHIP_DISABLED_REASON}
        >
          Ask
        </Button>
      </div>
    </div>
  );

  if (coachUnavailable) {
    return (
      <section
        data-testid="concierge"
        data-concierge-availability={availability}
        aria-label="Transaction concierge"
        className={cn("flex min-h-0 flex-col", "max-md:relative max-md:overflow-hidden", className)}
      >
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto py-3 max-md:py-2",
            "max-md:pb-[var(--coach-compose-inset)]",
          )}
        >
          <ConciergeUnavailableState
            showAgentLink={showAgentLinkWhenUnavailable}
            className="my-0 max-md:gap-3 max-md:py-5 max-md:[&_[data-slot=empty-title]]:text-base max-md:[&_[data-slot=empty-title]]:leading-snug max-md:[&_[data-slot=empty-description]]:text-small"
          />
        </div>
        {unavailableCompose}
      </section>
    );
  }

  const starterChips = (
    <div
      aria-label="Suggested questions"
      className={cn(
        "-mx-5 flex gap-2 px-5 pb-1 md:mx-0",
        pinFirstSessionMobile
          ? "flex-wrap"
          : "max-md:flex-nowrap max-md:overflow-x-auto max-md:overflow-y-hidden max-md:overscroll-x-contain max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden",
      )}
    >
      {starters.map((starter) => (
        <Button
          key={starter}
          type="button"
          variant="secondary"
          className={cn(
            "h-auto min-h-11 w-max max-w-[min(17.5rem,calc(100vw-3rem))] shrink-0 rounded-full bg-sage px-4 py-2 text-left text-sm whitespace-normal text-sage-foreground hover:bg-sage/80",
            "max-md:max-h-11 max-md:min-h-11 max-md:overflow-hidden max-md:text-ellipsis max-md:leading-none max-md:whitespace-nowrap",
            pinFirstSessionMobile &&
              "max-md:px-3 max-md:py-1.5 max-md:text-xs max-md:leading-snug max-md:whitespace-normal",
          )}
          disabled={busy || coachUnavailable}
          title={coachUnavailable ? CHIP_DISABLED_REASON : undefined}
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
      data-concierge-availability={availability}
      aria-label="Transaction concierge"
      className={cn(
        "flex min-h-0 flex-col",
        "max-md:relative max-md:overflow-hidden",
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

        {scrollIntro && !(pinFirstSessionMobile && hasConversation) ? (
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
          mobileReplyGrid ? MOBILE_COMPOSE_GRID : MOBILE_COMPOSE_DOCK,
        )}
        data-testid="concierge-compose"
      >
        <form
          className={cn(
            "pointer-events-none flex gap-2 border-t border-border/70 bg-card/95 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.14)] backdrop-blur md:pointer-events-auto md:bg-card md:shadow-none md:backdrop-blur-none",
            mobileReplyGrid ? "pt-2" : "pt-3",
          )}
          onSubmit={(event) => {
            event.preventDefault();
            if (coachUnavailable) {
              return;
            }
            void submit(question);
          }}
        >
          <input
            data-testid="concierge-question"
            className="pointer-events-auto min-h-11 min-w-0 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-md:text-[0.8125rem] disabled:cursor-not-allowed disabled:opacity-60"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={
              coachUnavailable
                ? "AI coach unavailable on this deployment"
                : questionPlaceholder
            }
            disabled={coachUnavailable}
            aria-disabled={coachUnavailable}
          />
          <Button
            type="submit"
            data-testid="concierge-ask"
            className="pointer-events-auto h-11 rounded-full px-5"
            disabled={
              coachUnavailable || busy || question.trim().length === 0
            }
            title={coachUnavailable ? CHIP_DISABLED_REASON : undefined}
          >
            Ask
          </Button>
        </form>
      </div>
    </section>
  );
}
