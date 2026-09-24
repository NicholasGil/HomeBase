"use client";

import { Button } from "@/components/ui/button";
import { coachDailyFocusPrompt } from "@/lib/coach-return-copy";
import { cn } from "@/lib/utils";

export function CoachDailyCheckIn({
  options,
  onPick,
  onDismiss,
  className,
}: {
  options: readonly string[];
  onPick: (label: string) => void;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <section
      data-testid="coach-daily-check-in"
      aria-label="Daily check-in"
      className={cn(
        "rounded-xl border border-border/80 bg-muted/30 px-4 py-3",
        className,
      )}
    >
      <p className="text-small font-medium text-foreground">
        {coachDailyFocusPrompt()}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {options.map((label) => (
          <Button
            key={label}
            type="button"
            variant="secondary"
            className="h-auto min-h-11 w-full justify-start rounded-xl px-4 py-2.5 text-left text-sm whitespace-normal"
            onClick={() => onPick(label)}
          >
            {label}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 text-muted-foreground"
          onClick={onDismiss}
        >
          Skip for now
        </Button>
      </div>
    </section>
  );
}
