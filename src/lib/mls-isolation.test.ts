import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_FEATURE_FLAGS } from "@/lib/flags";

const MLS_PACKAGES = [
  "simplyrets",
  "bridgeinteractive",
  "@bridgeinteractive/node",
  "realty-mole",
  "idxbroker",
  "spark-api",
  "reso-web-api",
  "trestle",
];

const LISTING_SCRAPE = /https?:\/\/(?:www\.)?(?:zillow|realtor|redfin|homes\.com|trulia|apartments\.com)/i;

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git"
    ) {
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

describe("P7 MLS isolation", () => {
  it("leaves FLAG_MLS off", () => {
    expect(DEFAULT_FEATURE_FLAGS.FLAG_MLS).toBe(false);
  });

  it("does not install an MLS or IDX client", () => {
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
    for (const name of MLS_PACKAGES) {
      expect(names).not.toContain(name);
    }
  });

  it("does not scrape listing sites", () => {
    const files = walk(process.cwd());
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(LISTING_SCRAPE);
    }
  });
});
