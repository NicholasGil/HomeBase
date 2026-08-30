import { describe, expect, it } from "vitest";

import { loadFoundation } from "@/app/actions/foundation";

describe("loadFoundation", () => {
  it("returns the seeded org, eight buyers, and flags off", async () => {
    const foundation = await loadFoundation();
    expect(foundation.org.name).toBe("Lookout Realty");
    expect(foundation.buyers).toHaveLength(8);
    expect(foundation.buyers[0]?.name).not.toBe(foundation.buyers[1]?.name);
    expect(foundation.buyers[0]?.stage).not.toBe(foundation.buyers[1]?.stage);
    expect(foundation.tables).toEqual(
      expect.arrayContaining([
        "orgs",
        "users",
        "memberships",
        "clients",
        "transactions",
        "journeyStages",
        "tasks",
        "auditLog",
      ]),
    );
    expect(Object.values(foundation.flags).every((flag) => flag === false)).toBe(
      true,
    );
  });
});
