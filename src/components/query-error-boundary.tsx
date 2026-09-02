"use client";

import { Component, type ReactNode, useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const DEFAULT_MESSAGE = "This section did not load.";

export function QueryErrorFallback({
  message = DEFAULT_MESSAGE,
  onRetry,
  children,
}: {
  message?: string;
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <Empty
      role="alert"
      data-testid="query-error"
      className="rounded-[14px] bg-card py-8 ring-1 ring-black/6"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-muted-foreground">
          <TriangleAlert aria-hidden />
        </EmptyMedia>
        {children ?? <EmptyTitle className="text-base">{message}</EmptyTitle>}
        <EmptyDescription className="leading-6">
          Nothing was changed. You can try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 px-4"
          onClick={onRetry}
        >
          <RotateCcw data-icon="inline-start" aria-hidden />
          Retry
        </Button>
      </EmptyContent>
    </Empty>
  );
}

class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(error: unknown) {
    // redirect() / notFound() from a form action travel through the tree as
    // errors; hand them back to Next instead of treating them as a failure.
    unstable_rethrow(error);
    return { failed: true };
  }

  override render() {
    if (this.state.failed) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Catches a thrown query or server-component error for one data region and
 * offers a 44px Retry. Retry remounts the region (re-subscribing any live
 * queries) and refreshes the server tree so server-rendered regions reload.
 */
export function QueryErrorBoundary({
  children,
  message,
  fallback,
}: {
  children: ReactNode;
  /** One neutral sentence naming the region that failed. */
  message?: string;
  /** Custom node shown instead of `message`; Retry is still rendered. */
  fallback?: ReactNode;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  return (
    <Boundary
      key={attempt}
      fallback={
        <QueryErrorFallback
          message={message}
          onRetry={() => {
            router.refresh();
            setAttempt((current) => current + 1);
          }}
        >
          {fallback}
        </QueryErrorFallback>
      }
    >
      {children}
    </Boundary>
  );
}
