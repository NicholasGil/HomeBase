import { readFileSync } from "node:fs";
import path from "node:path";

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "./_generated/api";
import * as audit from "./lib/audit";
import schema from "./schema";
import { modules } from "./test.setup";

describe("auditLog", () => {
  it("is append-only in the helper module", () => {
    expect(Object.keys(audit)).toEqual(["appendAuditLog"]);
  });

  it("never ships update or delete functions against auditLog", () => {
    const convexDir = path.join(process.cwd(), "convex");
    const files = [
      "lib/audit.ts",
      "seed.ts",
      "orgs.ts",
      "transactions.ts",
      "tasks.ts",
      "journey.ts",
      "dashboard.ts",
    ];
    const banned = /\.(patch|replace|delete)\(\s*["']auditLog["']/;
    for (const file of files) {
      const source = readFileSync(path.join(convexDir, file), "utf8");
      expect(source, file).not.toMatch(banned);
    }
  });

  it("writes only inserts from seed", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const entries = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.action.length > 0)).toBe(true);
  });
});
