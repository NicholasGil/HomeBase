import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_FEATURE_FLAGS } from "@/lib/flags";

const LIVE_PACKAGES = [
  "dropbox-sign",
  "@dropbox/sign",
  "docusign-esign",
  "docusign",
  "hellosign-sdk",
  "persona",
  "persona-node",
  "@stripe/stripe-js",
  "stripe",
];

describe("P6 provider isolation", () => {
  it("does not install live e-sign or IDV packages", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
    for (const name of LIVE_PACKAGES) {
      expect(names).not.toContain(name);
    }
  });

  it("leaves FLAG_ESIGN and FLAG_IDV off", () => {
    expect(DEFAULT_FEATURE_FLAGS.FLAG_ESIGN).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.FLAG_IDV).toBe(false);
  });
});
