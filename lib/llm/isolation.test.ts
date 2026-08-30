import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const PROVIDER = /from ["'](?:ai|@ai-sdk\/|openai|@anthropic-ai\/|@google\/generative-ai)/;

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe("model access", () => {
  it("does not import a model SDK outside lib/llm", () => {
    const files = walk(process.cwd()).filter(
      (file) => !file.includes(`${path.sep}lib${path.sep}llm${path.sep}`),
    );
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(PROVIDER);
    }
  });
});
