import { cn } from "@/lib/utils";

function todayCheckInCopy(stageLabel: string, firstName: string): string {
  return `Hi ${firstName} — still in ${stageLabel}. Anything new since your last visit?`;
}

/** Render-only daily ritual beat (visit + day gating lives in CoachHabitConcierge). */
export function CoachDailyCheckIn({
  stageLabel,
  firstName,
  className,
}: {
  storageKey?: string;
  stageLabel: string;
  firstName: string;
  className?: string;
}) {
  return (
    <div
      data-testid="coach-daily-check-in"
      className={cn(
        "rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-small",
        className,
      )}
    >
      <p className="font-medium text-foreground">Today&apos;s check-in</p>
      <p className="mt-0.5 text-muted-foreground">
        {todayCheckInCopy(stageLabel, firstName)}
      </p>
    </div>
  );
}
