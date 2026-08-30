import type { Doc } from "../_generated/dataModel";

export type DashboardMoney = {
  amountCents: number;
  currency: "USD";
  provenance: "ai_estimate" | "lender_issued" | "title_issued" | "user_entered";
  asOf: number;
  label?: string;
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
};

export function summarizeBuyerDashboard(input: {
  transactionId: string;
  stage: string;
  stageLabel: string;
  status: string;
  owedToday: DashboardMoney | null;
  propertyAddress: BuyerDashboardView["propertyAddress"];
  tasks: Pick<Doc<"tasks">, "title" | "status" | "assigneeRole">[];
}): BuyerDashboardView {
  const done = input.tasks
    .filter((task) => task.status === "done")
    .map((task) => task.title);
  const nextTask = input.tasks.find((task) => task.status === "open") ?? null;
  const waitingTask =
    nextTask ?? input.tasks.find((task) => task.status === "blocked") ?? null;

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
  };
}

export function isIssuedMoney(figure: DashboardMoney) {
  return (
    figure.provenance === "lender_issued" || figure.provenance === "title_issued"
  );
}
