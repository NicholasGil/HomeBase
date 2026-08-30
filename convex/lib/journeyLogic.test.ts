import { describe, expect, it } from "vitest";

import {
  assertReplaceableStages,
  decorateStages,
  nextStageAfter,
  openBlockingTasks,
} from "./journeyLogic";

const stages = [
  { key: "under_contract", label: "Under Contract", order: 7 },
  { key: "inspection", label: "Inspection", order: 8 },
  { key: "appraisal", label: "Appraisal", order: 9 },
];

describe("journey logic", () => {
  it("marks stages complete, current, and upcoming", () => {
    const view = decorateStages(stages, "inspection");
    expect(view.map((stage) => stage.state)).toEqual([
      "complete",
      "current",
      "upcoming",
    ]);
  });

  it("treats open and blocked blocking tasks as holds", () => {
    const tasks = [
      {
        title: "Schedule inspection",
        status: "open" as const,
        assigneeRole: "agent",
        stage: "inspection",
        blocksStage: true,
      },
      {
        title: "Tour Saturday listings",
        status: "open" as const,
        assigneeRole: "buyer",
        stage: "showings",
        blocksStage: false,
      },
    ];
    expect(openBlockingTasks(tasks, "inspection")).toHaveLength(1);
    expect(openBlockingTasks(tasks, "showings")).toHaveLength(0);
    expect(nextStageAfter(stages, "inspection")?.key).toBe("appraisal");
  });

  it("rejects an empty or duplicate stage list", () => {
    expect(() => assertReplaceableStages([])).toThrow("INVALID_STAGES");
    expect(() =>
      assertReplaceableStages([
        { key: "a", label: "A", order: 1 },
        { key: "a", label: "B", order: 2 },
      ]),
    ).toThrow("INVALID_STAGES");
  });
});
