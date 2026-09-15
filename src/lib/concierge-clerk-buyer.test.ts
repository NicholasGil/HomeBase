import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const fetchQueryMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("convex/nextjs", () => ({
  fetchQuery: fetchQueryMock,
}));

describe("clerkBuyerConciergeFacts", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    fetchQueryMock.mockReset();
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
  });

  async function load() {
    return await import("@/lib/concierge-clerk-buyer");
  }

  it("returns null when Clerk has no user", async () => {
    authMock.mockResolvedValue({ userId: null });
    const { clerkBuyerConciergeFacts } = await load();
    await expect(clerkBuyerConciergeFacts()).resolves.toBeNull();
  });

  it("returns FORBIDDEN for signed-in non-buyer membership", async () => {
    authMock.mockResolvedValue({
      userId: "user_agent",
      getToken: vi.fn().mockResolvedValue("jwt"),
    });
    fetchQueryMock.mockResolvedValueOnce({ role: "agent" });
    const { clerkBuyerConciergeFacts } = await load();
    await expect(clerkBuyerConciergeFacts()).resolves.toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("returns discovery-empty facts for buyer with no dashboard", async () => {
    authMock.mockResolvedValue({
      userId: "user_buyer",
      getToken: vi.fn().mockResolvedValue("jwt"),
    });
    fetchQueryMock
      .mockResolvedValueOnce({
        role: "buyer",
        name: "Alex",
        userId: "u1",
        orgId: "o1",
        email: "a@b.c",
      })
      .mockResolvedValueOnce(null);
    const { clerkBuyerConciergeFacts } = await load();
    const result = await clerkBuyerConciergeFacts();
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.facts.map((row) => row.key)).toContain("on_file");
    }
  });

  it("loads gatherContext when buyer has a property on file", async () => {
    authMock.mockResolvedValue({
      userId: "user_buyer",
      getToken: vi.fn().mockResolvedValue("jwt"),
    });
    fetchQueryMock
      .mockResolvedValueOnce({
        role: "buyer",
        name: "Alex",
        userId: "u1",
        orgId: "o1",
        email: "a@b.c",
      })
      .mockResolvedValueOnce({
        transactionId: "tx_123",
        propertyAddress: { line1: "814 Maple Ave", city: "Huntsville" },
        where: { label: "Inspection" },
      })
      .mockResolvedValueOnce([
        {
          key: "next",
          text: "Next is Schedule inspection, assigned to agent.",
          source: "tasks",
        },
      ]);
    const { clerkBuyerConciergeFacts } = await load();
    const result = await clerkBuyerConciergeFacts();
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.facts[0]?.text).toContain("Schedule inspection");
    }
    expect(fetchQueryMock).toHaveBeenCalledTimes(3);
  });
});
