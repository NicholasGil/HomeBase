import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const fetchQueryMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("convex/nextjs", () => ({
  fetchQuery: fetchQueryMock,
}));

describe("clerkBuyerConciergeContext", () => {
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
    const { clerkBuyerConciergeContext } = await load();
    await expect(clerkBuyerConciergeContext()).resolves.toBeNull();
  });

  it("returns FORBIDDEN for signed-in non-buyer membership", async () => {
    authMock.mockResolvedValue({
      userId: "user_agent",
      getToken: vi.fn().mockResolvedValue("jwt"),
    });
    fetchQueryMock.mockResolvedValueOnce({ role: "agent" });
    const { clerkBuyerConciergeContext } = await load();
    await expect(clerkBuyerConciergeContext()).resolves.toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("returns discoveryEmpty for buyer with no property on file", async () => {
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
    const { clerkBuyerConciergeContext } = await load();
    await expect(clerkBuyerConciergeContext()).resolves.toEqual({
      ok: true,
      discoveryEmpty: true,
    });
  });
});
