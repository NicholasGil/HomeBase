import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const cookieSet = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSet,
  })),
}));

describe("GET /demo/enter/[persona]", () => {
  beforeEach(() => {
    redirect.mockClear();
    cookieSet.mockClear();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  async function loadGet() {
    const mod = await import("./route");
    return mod.GET;
  }

  it("throws when fixture preview is not allowed (production without demo)", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("REALTYRISE_DEMO_MODE", "1");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test");

    const GET = await loadGet();
    await expect(
      GET(new Request("http://localhost/demo/enter/buyer-coach"), {
        params: Promise.resolve({ persona: "buyer-coach" }),
      }),
    ).rejects.toMatchObject({ name: "ProductionAuthMisconfiguredError" });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("throws when demo mode is off even if fixtures are allowed locally", async () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("REALTYRISE_DEMO_MODE", "0");

    const GET = await loadGet();
    await expect(
      GET(new Request("http://localhost/demo/enter/agent"), {
        params: Promise.resolve({ persona: "agent" }),
      }),
    ).rejects.toMatchObject({ name: "ProductionAuthMisconfiguredError" });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("throws when both fixture and demo gates are closed", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("REALTYRISE_DEMO_MODE", "0");

    const GET = await loadGet();
    await expect(
      GET(new Request("http://localhost/demo/enter/vendor"), {
        params: Promise.resolve({ persona: "vendor" }),
      }),
    ).rejects.toMatchObject({ name: "ProductionAuthMisconfiguredError" });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("sets the test-session cookie and redirects when demo + fixtures are allowed", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("REALTYRISE_DEMO_MODE", "1");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    const GET = await loadGet();
    await expect(
      GET(new Request("http://localhost/demo/enter/buyer-coach"), {
        params: Promise.resolve({ persona: "buyer-coach" }),
      }),
    ).rejects.toThrow(/^REDIRECT:/);

    expect(cookieSet).toHaveBeenCalledTimes(1);
    expect(cookieSet.mock.calls[0]?.[0]).toBe("hb_test_identity");
    expect(redirect).toHaveBeenCalledWith("/coach");
  });
});
