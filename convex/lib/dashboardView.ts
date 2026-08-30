import type { Doc } from "../_generated/dataModel";

import {
  decorateStages,
  nextStageAfter,
  openBlockingTasks,
  type JourneyStageView,
  type StageLike,
} from "./journeyLogic";

export type DashboardMoney = {
  amountCents: number;
  currency: "USD";
  provenance: "ai_estimate" | "lender_issued" | "title_issued" | "user_entered";
  asOf: number;
  label?: string;
};

export type DashboardTask = {
  title: string;
  status: Doc<"tasks">["status"];
  assigneeRole: Doc<"tasks">["assigneeRole"];
  stage: string;
  blocksStage: boolean;
};

export type DashboardDeadline = {
  label: string;
  at: number;
};

export type DashboardContact = {
  name: string;
  role: string;
};

export type BuyerDashboardView = {
  transactionId: string;
  where: {
    key: string;
    label: string;
    status: string;
  };
  done: string[];
  next: { title: string; assigneeRole: string } | null;
  waitingOn: string | null;
  owedToday: DashboardMoney | null;
  propertyAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  stages: JourneyStageView[];
  currentStageTasks: DashboardTask[];
  blockingTasks: { title: string; assigneeRole: string }[];
  canAdvance: boolean;
  nextStage: { key: string; label: string } | null;
  deadlines: DashboardDeadline[];
  contacts: DashboardContact[];
};

export function summarizeBuyerDashboard(input: {
  transactionId: string;
  stage: string;
  stageLabel: string;
  status: string;
  owedToday: DashboardMoney | null;
  propertyAddress: BuyerDashboardView["propertyAddress"];
  tasks: DashboardTask[];
  stages: readonly StageLike[];
  deadlines?: DashboardDeadline[];
  contacts?: DashboardContact[];
}): BuyerDashboardView {
  const done = input.tasks
    .filter((task) => task.status === "done")
    .map((task) => task.title);
  const nextTask = input.tasks.find((task) => task.status === "open") ?? null;
  const waitingTask =
    nextTask ?? input.tasks.find((task) => task.status === "blocked") ?? null;
  const blocking = openBlockingTasks(input.tasks, input.stage);
  const upcoming = nextStageAfter(input.stages, input.stage);

  return {
    transactionId: input.transactionId,
    where: {
      key: input.stage,
      label: input.stageLabel,
      status: input.status,
    },
    done,
    next: nextTask
      ? { title: nextTask.title, assigneeRole: nextTask.assigneeRole }
      : null,
    waitingOn: waitingTask?.assigneeRole ?? null,
    owedToday: input.owedToday,
    propertyAddress: input.propertyAddress,
    stages: decorateStages(input.stages, input.stage),
    currentStageTasks: input.tasks.filter((task) => task.stage === input.stage),
    blockingTasks: blocking.map((task) => ({
      title: task.title,
      assigneeRole: task.assigneeRole,
    })),
    canAdvance: blocking.length === 0 && upcoming !== null,
    nextStage: upcoming
      ? { key: upcoming.key, label: upcoming.label }
      : null,
    deadlines: input.deadlines ?? [],
    contacts: input.contacts ?? [],
  };
}

export function isIssuedMoney(figure: DashboardMoney) {
  return (
    figure.provenance === "lender_issued" || figure.provenance === "title_issued"
  );
}
