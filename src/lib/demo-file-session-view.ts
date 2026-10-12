import { isDemoMode, type AuthEnv } from "@/lib/auth-config";
import { DISPLAY_TIME_ZONE } from "../../convex/lib/displayTime";
import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { fixtureConciergeInspectionAt } from "@/lib/demo-fixture-dates";

export const DEMO_ATTEND_INSPECTION_TITLE = "Attend inspection";

export function formatFixtureShortChicagoDate(
  at: number,
  timeZone: string = DISPLAY_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  })
    .format(at)
    .replace(/[\u00a0\u202f]/g, " ");
}

export function demoBookedInspectionApplies(
  view: BuyerDashboardView,
  env: AuthEnv = process.env,
): boolean {
  return (
    isDemoMode(env) &&
    view.transactionId === "seed:buyer-a" &&
    view.where.key === "inspection"
  );
}

export function coachFileNextDisplayLabel(
  view: BuyerDashboardView,
  env: AuthEnv = process.env,
  now = Date.now(),
): string {
  if (view.next === null) {
    return "No open task";
  }
  if (
    demoBookedInspectionApplies(view, env) &&
    view.next.title === DEMO_ATTEND_INSPECTION_TITLE
  ) {
    const at = fixtureConciergeInspectionAt(env, now);
    return `${DEMO_ATTEND_INSPECTION_TITLE} · ${formatFixtureShortChicagoDate(at)}`;
  }
  return view.next.title;
}

type DemoTask = {
  stage: string;
  title: string;
  assigneeRole: "buyer" | "agent" | "broker" | "admin" | "vendor";
  status: "open" | "blocked" | "done" | "canceled";
  blocksStage: boolean;
};

/** Demo-only task list: inspection scheduled; buyer attends next. */
export function demoBookedInspectionTasks<T extends DemoTask>(tasks: readonly T[]): T[] {
  if (!isDemoMode()) {
    return [...tasks];
  }
  const mapped = tasks.map((task) =>
    task.title === "Schedule inspection"
      ? { ...task, status: "done" as const }
      : { ...task },
  );
  const hasAttendOpen = mapped.some(
    (task) =>
      task.title === DEMO_ATTEND_INSPECTION_TITLE && task.status === "open",
  );
  if (hasAttendOpen) {
    return mapped;
  }
  return [
    ...mapped,
    {
      stage: "inspection",
      title: DEMO_ATTEND_INSPECTION_TITLE,
      assigneeRole: "buyer",
      status: "open",
      blocksStage: false,
    } as T,
  ];
}

export function demoBookedInspectionConciergeNextLine(
  env: AuthEnv = process.env,
  now = Date.now(),
): string {
  const at = fixtureConciergeInspectionAt(env, now);
  const short = formatFixtureShortChicagoDate(at);
  return `Next is ${DEMO_ATTEND_INSPECTION_TITLE} on ${short}, assigned to buyer.`;
}

export function isDemoBuyerAClerk(clerkId: string) {
  return clerkId === SEED_CLERK_IDS.buyerA;
}
