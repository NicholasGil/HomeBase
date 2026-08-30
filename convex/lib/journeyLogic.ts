export type StageLike = {
  key: string;
  label: string;
  order: number;
};

export type TaskLike = {
  title: string;
  status: "open" | "blocked" | "done" | "canceled";
  assigneeRole: string;
  stage: string;
  blocksStage: boolean;
};

export type JourneyStageState = "complete" | "current" | "upcoming";

export type JourneyStageView = StageLike & {
  state: JourneyStageState;
};

export function sortStages<T extends StageLike>(stages: readonly T[]): T[] {
  return [...stages].sort((left, right) => left.order - right.order);
}

export function decorateStages(
  stages: readonly StageLike[],
  currentKey: string,
): JourneyStageView[] {
  const sorted = sortStages(stages);
  const current = sorted.find((stage) => stage.key === currentKey);
  const currentOrder = current?.order ?? Number.POSITIVE_INFINITY;
  return sorted.map((stage) => ({
    key: stage.key,
    label: stage.label,
    order: stage.order,
    state:
      stage.key === currentKey
        ? "current"
        : stage.order < currentOrder
          ? "complete"
          : "upcoming",
  }));
}

export function openBlockingTasks<T extends TaskLike>(
  tasks: readonly T[],
  stage: string,
): T[] {
  return tasks.filter(
    (task) =>
      task.stage === stage &&
      task.blocksStage &&
      (task.status === "open" || task.status === "blocked"),
  );
}

export function nextStageAfter(
  stages: readonly StageLike[],
  currentKey: string,
): StageLike | null {
  const sorted = sortStages(stages);
  const index = sorted.findIndex((stage) => stage.key === currentKey);
  if (index === -1) {
    return null;
  }
  return sorted[index + 1] ?? null;
}

export function assertReplaceableStages(stages: readonly StageLike[]) {
  if (stages.length === 0) {
    throw new Error("INVALID_STAGES");
  }
  const keys = new Set<string>();
  const orders = new Set<number>();
  for (const stage of stages) {
    if (stage.key.length === 0 || stage.label.length === 0) {
      throw new Error("INVALID_STAGES");
    }
    if (keys.has(stage.key) || orders.has(stage.order)) {
      throw new Error("INVALID_STAGES");
    }
    keys.add(stage.key);
    orders.add(stage.order);
  }
}
