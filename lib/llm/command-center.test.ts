import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { completeCommandCenterPriority, loadPrompt } from "./index";
import { containsRawPii, redactPii } from "./redact";

describe("command center priority copy", () => {
  it("loads a versioned prompt that explains and never advises", () => {
    const prompt = loadPrompt("command-center.v1");
    expect(prompt).toMatch(/Never advise/);
    expect(readFileSync(
      path.join(process.cwd(), "lib/llm/prompts/command-center.v1.txt"),
      "utf8",
    )).toBe(prompt);
  });

  it("redacts street addresses before writing a reason", () => {
    const street = "814 Maple Ave is the file";
    expect(containsRawPii(street)).toBe(true);
    expect(containsRawPii(redactPii(street))).toBe(false);
    const reason = completeCommandCenterPriority({
      exceptions: ["missing_financing_document"],
      stageLabel: street,
    });
    expect(reason).toBe("Financing file is missing the preapproval.");
    expect(reason).not.toMatch(/814 Maple Ave/);
  });
});
