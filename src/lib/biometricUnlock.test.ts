import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import schema from "../../convex/schema";
import {
  FORBIDDEN_BIOMETRIC_FIELDS,
  requestDeviceUnlock,
} from "@/lib/biometricUnlock";

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

describe("tier 1 biometric unlock", () => {
  it("stores nothing and returns only a local availability result", async () => {
    const result = await requestDeviceUnlock();
    expect(result.ok === false || result.ok === true).toBe(true);
    if (result.ok) {
      expect(result.method).toBe("platform");
    } else {
      expect(["UNAVAILABLE", "UNSUPPORTED"]).toContain(result.reason);
    }
    expect(JSON.stringify(result)).not.toMatch(/template|selfie|embedding/i);
  });

  it("has no face or biometric template field on the schema", () => {
    const tables = schema.tables;
    expect("idvSessions" in tables).toBe(true);
    expect("signaturePackets" in tables).toBe(true);
    const source = readFileSync(
      path.join(process.cwd(), "convex/schema.ts"),
      "utf8",
    );
    for (const field of FORBIDDEN_BIOMETRIC_FIELDS) {
      expect(source, field).not.toContain(field);
    }
  });

  it("has no transmission path for a biometric template", () => {
    const files = walk(process.cwd()).filter(
      (file) =>
        !file.endsWith(`${path.sep}biometricUnlock.ts`) &&
        !file.endsWith(`${path.sep}biometricUnlock.test.ts`),
    );
    const writeSites = [
      "convex/idv.ts",
      "convex/esign.ts",
      "convex/lib/idvSandbox.ts",
      "src/lib/idv-access.ts",
      "src/lib/biometricUnlock.ts",
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const field of FORBIDDEN_BIOMETRIC_FIELDS) {
        expect(source, `${file} ${field}`).not.toContain(field);
      }
    }
    for (const rel of writeSites) {
      const source = readFileSync(path.join(process.cwd(), rel), "utf8");
      expect(source).not.toMatch(/ctx\.db\.insert\([^)]*face/i);
      expect(source).not.toMatch(/fetch\([^)]*selfie/i);
      expect(source).not.toMatch(/https?:\/\/[^"' ]+(persona|stripe\.com\/identity)/i);
    }
  });
});
