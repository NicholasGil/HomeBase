import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

describe("org directory", () => {
  it("returns only grantable roles and never clerkId", async () => {
    const t = await seeded();
    const asBuyer = t.withIdentity({ subject: "clerk_buyer_a" });
    const directory = await asBuyer.query(api.me.listOrgDirectory, {});
    expect(directory.map((row) => row.role)).toEqual(["vendor"]);
    expect(directory.map((row) => row.name)).toEqual(["Jordan Hale"]);
    for (const row of directory) {
      expect(row).toEqual({
        userId: row.userId,
        name: row.name,
        role: "vendor",
      });
      expect(row).not.toHaveProperty("clerkId");
      expect(row).not.toHaveProperty("email");
    }
  });

  it("denies vendor and unauthenticated callers", async () => {
    const t = await seeded();
    await expect(t.query(api.me.listOrgDirectory, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.me.listOrgDirectory, {}),
    ).rejects.toThrow("FORBIDDEN");
  });
});
