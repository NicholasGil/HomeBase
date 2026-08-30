import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { completeExplainer, loadPrompt } from "./index";
import { checkUplChecklist, UPL_RULES } from "./upl";

describe("UPL checklist", () => {
  it("matches DESIGN.md §5 rules and every explainer section passes", () => {
    const checklist = readFileSync(
      path.join(process.cwd(), "docs/legal/upl-checklist.md"),
      "utf8",
    );
    expect(checklist).toContain("Describes only");
    expect(checklist).toContain("Templated output");
    expect(checklist).toContain("No drafting");
    expect(checklist).toContain("No enforceability opinions");
    expect(checklist).toContain("Ask my agent");
    expect([...UPL_RULES]).toEqual([
      "describes_only",
      "templated_output",
      "no_drafting",
      "no_enforceability_opinions",
      "ask_my_agent",
    ]);

    const prompt = loadPrompt("explainer.v1");
    expect(prompt).toContain("Describe. Never advise.");
    expect(prompt).toContain("Do not draft");
    expect(prompt).toContain("Do not opine on enforceability");

    const sections = completeExplainer();
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const result = checkUplChecklist(section);
      expect(result.failed).toEqual([]);
      expect(result.ok).toBe(true);
      expect(section.askAgent).toBe("Ask my agent");
    }
  });
});
