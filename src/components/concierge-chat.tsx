"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

import { askConcierge } from "@/app/actions/concierge";
import { ConciergeAnswerView } from "@/components/concierge-answer";
import { ConciergeUnavailableState } from "@/components/concierge-unavailable";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import { CONCIERGE_STARTERS } from "@/lib/concierge-starters";
import { CONCIERGE_MODEL_UNAVAILABLE_ANSWER } from "../../lib/llm/types";

export { CONCIERGE_STARTERS };

const CHIP_DISABLED_REASON =
  "AI coach unavailable — model key not configured on this deployment.";

/** Mobile coach card: Ask docked to the concierge footer. */
const MOBILE_COMPOSE_DOCK =
  "max-md:absolute max-md:inset-x-0 max-md:bottom-2 max-md:z-20 max-md:-mx-5 max-md:px-5 max-md:pb-[env(safe-area-inset-bottom)]";

const MOBILE_COMPOSE_GRID =
  "max-md:row-start-3 max-md:-mx-5 max-md:px-5 max-md:pb-[env(safe-area-inset-bottom)]";

/** File-session mobile: chips + Ask fixed above the tab bar; page scrolls. */
const MOBILE_STICKY_DOCK =
  "max-md:fixed max-md:inset-x-0 max-md:z-40 max-md:bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] max-md:border-t max-md:border-border/70 max-md:bg-card max-md:px-5 max-md:pt-2 max-md:pb-4 max-md:shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.14)]";

const CONCIERGE_SERVER_ERROR_MESSAGE =
  "Coach could not load an answer.";

const COACH_MOBILE_MQ = "(max-width: 767px)";

function subscribeCoachMobileMq(onChange: () => void) {
  const mq = window.matchMedia(COACH_MOBILE_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getCoachMobileMqSnapshot() {
  return window.matchMedia(COACH_MOBILE_MQ).matches;
}

function useCoachMaxMdViewport() {
  return useSyncExternalStore(
    subscribeCoachMobileMq,
    getCoachMobileMqSnapshot,
    () => false,
  );
}

export type ConciergePersistedTurn = {
  asked: string;
  answer: string;
  kind: string;
};

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
  /** Demo / long starter sets: wrap chips on 375 instead of clipping. */
  wrapMobileQuestionStarters = false,
  /** File-session return: pin restored Ask/answer above Ask on 375. */
  pinRestoredThreadOnMobile = false,
  /** File session @375: sticky chips + Ask above tab bar; document scroll only. */
  mobileStickyDockAboveTabBar = false,
  moreConciergeStarters = [],
  fileSummaryAboveThread = null,
  onThreadActiveChange,
  showAgentLinkWhenUnavailable = true,
  initialTurn = null,
  onTurnComplete,
}: {
  className?: string;
  starters?: readonly string[];
  idleHint?: string;
  questionPlaceholder?: string;
  availability?: ConciergeAvailability;
  scrollIntro?: ReactNode;
  pinStartersAboveScrollOnMobile?: boolean;
  wrapMobileQuestionStarters?: boolean;
  pinRestoredThreadOnMobile?: boolean;
  mobileStickyDockAboveTabBar?: boolean;
  /** Extra §M3 starters reachable via More questions (mobile file session). */
  moreConciergeStarters?: readonly string[];
  fileSummaryAboveThread?: ReactNode | null;
  onThreadActiveChange?: (active: boolean) => void;
  showAgentLinkWhenUnavailable?: boolean;
  initialTurn?: ConciergePersistedTurn | null;
  onTurnComplete?: (turn: ConciergePersistedTurn) => void;
}) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(initialTurn?.asked ?? null);
  const [answer, setAnswer] = useState<string | null>(initialTurn?.answer ?? null);
  const [kind, setKind] = useState<string | null>(initialTurn?.kind ?? null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(
    null,
  );
  const [moreQuestionsOpen, setMoreQuestionsOpen] = useState(false);
  const pinnedThreadRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  const coachUnavailable = availability === "model_key_missing";
  const pinFirstSessionMobile = pinStartersAboveScrollOnMobile;
  const pinMobileChips =
    pinFirstSessionMobile ||
    (pinRestoredThreadOnMobile && asked !== null && !coachUnavailable);
  const wrapMobileStarters = wrapMobileQuestionStarters;
  const horizontalScrollChips =
    !wrapMobileStarters &&
    (pinMobileChips || !pinFirstSessionMobile);
  const showPinnedMobileThread =
    (pinFirstSessionMobile || pinRestoredThreadOnMobile) &&
    asked !== null &&
    !coachUnavailable;
  const coachMaxMd = useCoachMaxMdViewport();
  const mobileStickyDock =
    mobileStickyDockAboveTabBar && coachMaxMd && !coachUnavailable;
  const showMoreQuestionsSheet =
    moreConciergeStarters.length > 0 && mobileStickyDock;
  const chipRowStarters =
    moreConciergeStarters.length > 0 && !coachMaxMd
      ? CONCIERGE_STARTERS
      : starters;
  const mobileReplyGrid = showPinnedMobileThread && !mobileStickyDock;
  const mobilePinnedLayout =
    !mobileStickyDock &&
    (mobileReplyGrid || (pinMobileChips && coachMaxMd));
  const pinnedThreadTestId =
    showPinnedMobileThread && pinRestoredThreadOnMobile
      ? "concierge-restored-thread"
      : showPinnedMobileThread && pinFirstSessionMobile
        ? "concierge-first-session-thread"
        : undefined;
  const renderPinnedMobileThread =
    showPinnedMobileThread && coachMaxMd;
  const renderScrollPinnedThread =
    showPinnedMobileThread && !coachMaxMd;

  useEffect(() => {
    if (answer === null || !showPinnedMobileThread) {
      return;
    }
    pinnedThreadRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [answer, showPinnedMobileThread]);

  useEffect(() => {
    if (asked !== null) {
      onThreadActiveChange?.(true);
    }
  }, [asked, onThreadActiveChange]);

  useLayoutEffect(() => {
    if (!mobileStickyDock || chipsScrollRef.current === null) {
      return;
    }
    chipsScrollRef.current.scrollLeft = 0;
  }, [mobileStickyDock, chipRowStarters]);

  useEffect(() => {
    if (!mobileStickyDock || answer === null) {
      return;
    }
    answerRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [answer, mobileStickyDock]);

  function showUnavailableAnswer() {
    setAnswer(CONCIERGE_MODEL_UNAVAILABLE_ANSWER.text);
    setKind(CONCIERGE_MODEL_UNAVAILABLE_ANSWER.kind);
  }

  function emitTurnComplete(
    nextAsked: string,
    nextAnswer: string,
    nextKind: string,
  ) {
    onTurnComplete?.({
      asked: nextAsked,
      answer: nextAnswer,
      kind: nextKind,
    });
  }

  async function submit(nextQuestion: string) {
    if (coachUnavailable) {
      setAsked(nextQuestion);
      showUnavailableAnswer();
      emitTurnComplete(
        nextQuestion,
        CONCIERGE_MODEL_UNAVAILABLE_ANSWER.text,
        CONCIERGE_MODEL_UNAVAILABLE_ANSWER.kind,
      );
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setAsked(nextQuestion);
    setAnswer(null);
    const result = await askConcierge({ question: nextQuestion });
    if (!result.ok) {
      if (result.reason === "MODEL_KEY_NOT_CONFIGURED") {
        showUnavailableAnswer();
        emitTurnComplete(
          nextQuestion,
          CONCIERGE_MODEL_UNAVAILABLE_ANSWER.text,
          CONCIERGE_MODEL_UNAVAILABLE_ANSWER.kind,
        );
      } else if (result.reason === "SERVER_ERROR") {
        setErrorMessage(CONCIERGE_SERVER_ERROR_MESSAGE);
        setLastFailedQuestion(nextQuestion);
        setQuestion(nextQuestion);
        setAnswer(null);
        setKind(null);
      } else {
        const refuseText = "You cannot ask the concierge.";
        setAnswer(refuseText);
        setKind("refuse");
        emitTurnComplete(nextQuestion, refuseText, "refuse");
      }
    } else {
      setAnswer(result.answer.text);
      setKind(result.answer.kind);
      emitTurnComplete(nextQuestion, result.answer.text, result.answer.kind);
    }
    setBusy(false);
  }

  const compactFirstSessionAnswer =
    "max-md:text-small max-md:leading-snug";

  function renderConversation(options?: { omitUserBubble?: boolean }) {
    const omitUserBubble = options?.omitUserBubble === true;
    return (
      <>
        {coachUnavailable && asked === null ? (
          <ConciergeUnavailableState
            showAgentLink={showAgentLinkWhenUnavailable}
            className="my-auto"
          />
        ) : null}
        {!coachUnavailable && asked === null && idleHint ? (
          <p className="text-center text-sm text-muted-foreground">
            {idleHint}
          </p>
        ) : null}
        {asked !== null && !omitUserBubble ? (
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {asked}
          </p>
        ) : null}
        {busy ? (
          <p className="text-sm text-muted-foreground">Checking this file…</p>
        ) : null}
        {errorMessage ? (
          <div
            role="alert"
            data-testid="concierge-error"
            className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <p>{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              data-testid="concierge-error-retry"
              className="min-h-11 w-full max-w-xs self-start rounded-full border-destructive/40 bg-card text-destructive hover:bg-destructive/10"
              onClick={() => {
                const retry =
                  question.trim().length > 0
                    ? question
                    : lastFailedQuestion ?? asked ?? "";
                if (retry.length === 0) {
                  return;
                }
                void submit(retry);
              }}
            >
              Try again
            </Button>
          </div>
        ) : null}
        {answer !== null ? (
          <div
            ref={answerRef}
            className={
              mobileStickyDock
                ? "scroll-mt-4 [scroll-margin-bottom:var(--coach-answer-scroll-margin)]"
                : undefined
            }
          >
            <ConciergeAnswerView
              text={answer}
              kind={kind}
              className={
                omitUserBubble ? compactFirstSessionAnswer : undefined
              }
            />
          </div>
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
      className={cn(
        "relative max-md:min-w-0",
        showMoreQuestionsSheet &&
          "max-md:flex max-md:items-center max-md:gap-2 max-md:pr-1",
        mobileStickyDock && horizontalScrollChips && !showMoreQuestionsSheet && "max-md:pr-1",
      )}
    >
      <div
        ref={mobileStickyDock ? chipsScrollRef : undefined}
        aria-label="Suggested questions"
        className={cn(
          "-mx-5 flex gap-2 px-5 pb-1 md:mx-0",
          showMoreQuestionsSheet && "max-md:min-w-0 max-md:flex-1",
          wrapMobileStarters && "flex-wrap",
          horizontalScrollChips &&
            "max-md:min-w-0 max-md:w-full max-md:max-w-full max-md:flex-nowrap max-md:items-center max-md:justify-start max-md:overflow-x-auto max-md:overflow-y-hidden max-md:overscroll-x-contain max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden",
          horizontalScrollChips &&
            !mobileStickyDock &&
            "max-md:[mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]",
        )}
      >
      {chipRowStarters.map((starter) => (
        <Button
          key={starter}
          type="button"
          variant="secondary"
          className={cn(
            "h-auto min-h-11 shrink-0 rounded-full bg-sage px-4 py-2 text-left text-sm text-sage-foreground hover:bg-sage/80",
            !wrapMobileStarters &&
              "w-max max-md:h-11 max-md:justify-start max-md:whitespace-nowrap",
            wrapMobileStarters &&
              "w-max max-w-[min(17.5rem,calc(100vw-3rem))] whitespace-normal",
            (wrapMobileStarters || pinRestoredThreadOnMobile) &&
              !mobileStickyDock &&
              "max-md:px-3 max-md:py-2 max-md:text-xs max-md:leading-snug max-md:whitespace-normal",
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
      {showMoreQuestionsSheet ? (
        <Sheet open={moreQuestionsOpen} onOpenChange={setMoreQuestionsOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="outline"
                data-testid="concierge-more-questions"
                className="h-11 shrink-0 rounded-full px-4 text-sm"
                disabled={busy || coachUnavailable}
              />
            }
          >
            More questions
          </SheetTrigger>
          <SheetContent
            side="bottom"
            data-testid="concierge-more-questions-sheet"
            className="max-h-[min(70vh,28rem)] gap-0"
          >
            <SheetHeader className="border-b border-border/70 pb-3">
              <SheetTitle>More questions</SheetTitle>
              <SheetDescription>
                All canonical questions for this file.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-2 overflow-y-auto py-4">
              {moreConciergeStarters.map((starter) => (
                <Button
                  key={starter}
                  type="button"
                  variant="secondary"
                  className="h-auto min-h-11 w-full justify-start rounded-xl bg-sage px-4 py-3 text-left text-sm text-sage-foreground hover:bg-sage/80"
                  disabled={busy || coachUnavailable}
                  onClick={() => {
                    setMoreQuestionsOpen(false);
                    setQuestion(starter);
                    void submit(starter);
                  }}
                >
                  {starter}
                </Button>
              ))}
            </div>
            <SheetClose
              render={
                <Button type="button" variant="ghost" className="min-h-11 w-full">
                  Close
                </Button>
              }
            />
          </SheetContent>
        </Sheet>
      ) : null}
      {mobileStickyDock && horizontalScrollChips ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card from-30% to-transparent max-md:block md:hidden"
        />
      ) : null}
    </div>
  );

  const composeForm = (
    <form
      className={cn(
        "flex w-full min-w-0 gap-2",
        mobileStickyDock
          ? "border-0 bg-transparent pt-2 shadow-none"
          : "border-t border-border/70 bg-card/95 pt-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.14)] backdrop-blur md:bg-card md:shadow-none md:backdrop-blur-none",
        mobilePinnedLayout && !mobileStickyDock ? "pt-2" : "",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (coachUnavailable || question.trim().length === 0) {
          return;
        }
        void submit(question);
      }}
    >
      <input
        data-testid="concierge-question"
        className="relative z-10 min-h-11 min-w-0 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-md:text-[0.8125rem] disabled:cursor-not-allowed disabled:opacity-60"
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
        className="relative z-20 h-11 shrink-0 rounded-full px-5 max-md:pointer-events-auto"
        disabled={coachUnavailable || busy}
        aria-disabled={
          coachUnavailable || busy || question.trim().length === 0
        }
        title={coachUnavailable ? CHIP_DISABLED_REASON : undefined}
      >
        Ask
      </Button>
    </form>
  );

  if (mobileStickyDock) {
    return (
      <section
        data-testid="concierge"
        data-concierge-availability={availability}
        data-coach-mobile-dock="sticky"
        aria-label="Transaction concierge"
        className={cn("flex min-h-0 flex-col max-md:min-w-0", className)}
      >
        <div
          data-testid="concierge-scroll-region"
          className="flex flex-col gap-3 py-4 max-md:overflow-visible max-md:py-3 max-md:pb-5"
        >
          {fileSummaryAboveThread ? (
            <div className="shrink-0 max-md:block md:hidden">
              {fileSummaryAboveThread}
            </div>
          ) : null}
          {scrollIntro && asked === null ? (
            <div className="shrink-0">{scrollIntro}</div>
          ) : null}
          <div aria-live="polite" className="flex flex-col gap-3">
            {pinRestoredThreadOnMobile && asked !== null ? (
              <div
                data-testid="concierge-restored-thread"
                className="flex flex-col gap-3"
              >
                {renderConversation({ omitUserBubble: true })}
              </div>
            ) : pinFirstSessionMobile && asked !== null ? (
              <div
                data-testid="concierge-first-session-thread"
                className="flex flex-col gap-3"
              >
                {renderConversation({ omitUserBubble: true })}
              </div>
            ) : (
              renderConversation()
            )}
          </div>
        </div>
        <div
          data-testid="concierge-mobile-dock"
          className={cn(MOBILE_STICKY_DOCK, "max-md:min-w-0")}
        >
          {starterChips}
          <div data-testid="concierge-compose">{composeForm}</div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="concierge"
      data-concierge-availability={availability}
      aria-label="Transaction concierge"
      className={cn(
        "flex min-h-0 flex-col",
        "max-md:relative max-md:min-h-0 max-md:overflow-x-hidden max-md:overflow-y-visible",
        mobilePinnedLayout &&
          "max-md:grid max-md:min-h-0 max-md:flex-1 max-md:min-w-0 max-md:w-full max-md:max-w-full max-md:grid-rows-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] max-md:gap-3 max-md:overflow-x-hidden",
        className,
      )}
    >
      {pinMobileChips ? (
        <div
          className={cn(
            "shrink-0 max-md:block md:hidden",
            mobilePinnedLayout &&
              "max-md:row-start-1 max-md:min-w-0 max-md:max-w-full max-md:overflow-hidden",
            showPinnedMobileThread ? "pt-2 pb-0" : "pt-4 pb-1",
          )}
        >
          {starterChips}
        </div>
      ) : null}
      {renderPinnedMobileThread ? (
        <div
          ref={pinnedThreadRef}
          aria-live="polite"
          data-testid={pinnedThreadTestId}
          className="flex min-h-0 min-w-0 flex-col gap-0 overflow-y-auto overflow-x-hidden py-0.5 max-md:row-start-2 max-md:max-w-full"
        >
          {renderConversation({ omitUserBubble: true })}
        </div>
      ) : null}
      <div
        data-testid="concierge-scroll-region"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4",
          !mobilePinnedLayout && "max-md:pb-[var(--coach-compose-inset)]",
          pinMobileChips && "max-md:pt-0",
          mobilePinnedLayout && "max-md:row-start-2 max-md:min-h-0 max-md:pb-0",
          renderPinnedMobileThread && "max-md:hidden",
        )}
      >
        <div className={cn(pinMobileChips && "max-md:hidden")}>
          {starterChips}
        </div>

        {scrollIntro && !(pinMobileChips && asked !== null) ? (
          <div className="shrink-0">{scrollIntro}</div>
        ) : null}

        <div
          aria-live={showPinnedMobileThread ? "off" : "polite"}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          {renderScrollPinnedThread ? (
            renderConversation()
          ) : renderPinnedMobileThread ? null : (
            renderConversation()
          )}
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 md:static",
          mobilePinnedLayout ? MOBILE_COMPOSE_GRID : MOBILE_COMPOSE_DOCK,
          mobilePinnedLayout &&
            "max-md:z-30 max-md:row-start-3 max-md:min-w-0 max-md:w-full max-md:max-w-full max-md:overflow-visible",
        )}
        data-testid="concierge-compose"
      >
        {composeForm}
      </div>
    </section>
  );
}
