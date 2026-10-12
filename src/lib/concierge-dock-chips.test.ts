import { describe, expect, it } from "vitest";

import {
  discoveryDockPreviewLabels,
  fileSessionDockPreviewLabels,
  resolveDiscoveryDockQuestion,
  resolveFileSessionDockQuestion,
} from "@/lib/concierge-dock-chips";
import { CONCIERGE_STARTERS } from "@/lib/concierge-starters";
import { COACH_FIRST_SESSION_STARTERS } from "@/lib/coach-first-session";

describe("concierge dock chips", () => {
  it("maps short file dock labels to canonical concierge questions", () => {
    expect(fileSessionDockPreviewLabels()).toEqual([
      "What's next?",
      "My inspection?",
    ]);
    expect(resolveFileSessionDockQuestion("What's next?")).toBe(
      "What happens next?",
    );
    expect(resolveFileSessionDockQuestion("My inspection?")).toBe(
      "When is my inspection?",
    );
    for (const question of CONCIERGE_STARTERS) {
      expect(resolveFileSessionDockQuestion(question)).toBe(question);
    }
  });

  it("maps short discovery dock labels to first-session questions", () => {
    expect(discoveryDockPreviewLabels()).toEqual([
      "What's next?",
      "What's missing?",
    ]);
    expect(resolveDiscoveryDockQuestion("What's next?")).toBe(
      COACH_FIRST_SESSION_STARTERS[0],
    );
    for (const question of COACH_FIRST_SESSION_STARTERS) {
      expect(resolveDiscoveryDockQuestion(question)).toBe(question);
    }
  });
});
