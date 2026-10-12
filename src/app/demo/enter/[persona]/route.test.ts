import { beforeEach, describe, expect, it, vi } from "vitest";

import { TEST_SESSION_COOKIE } from "@/lib/test-session";

describe("GET /demo/enter/[persona]", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  async function loadGet() {
    const mod = await import("./route");
    return mod.GET;
  }

  it("throws when demo mode is on but Clerk keys are configured in production", async () => {
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
  });

  it("redirects unknown persona to the demo chooser without setting a cookie", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("REALTYRISE_DEMO_MODE", "1");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    const GET = await loadGet();
    const response = await GET(
      new Request("http://localhost/demo/enter/not-a-persona"),
      {
        params: Promise.resolve({ persona: "not-a-persona" }),
      },
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/demo");
    expect(response.cookies.get(TEST_SESSION_COOKIE)).toBeUndefined();
  });

  it("sets the test-session cookie and redirects buyer-coach to /coach", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("REALTYRISE_DEMO_MODE", "1");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    const GET = await loadGet();
    const response = await GET(
      new Request("http://localhost/demo/enter/buyer-coach"),
      {
        params: Promise.resolve({ persona: "buyer-coach" }),
      },
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/coach");
    const cookie = response.cookies.get(TEST_SESSION_COOKIE);
    expect(cookie?.value).toMatch(/^clerk_buyer_a/);
  });

  it("redirects buyer-discovery to /coach with discovery-empty session marker", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("REALTYRISE_DEMO_MODE", "1");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    const GET = await loadGet();
    const response = await GET(
      new Request("http://localhost/demo/enter/buyer-discovery"),
      {
        params: Promise.resolve({ persona: "buyer-discovery" }),
      },
    );

    expect(new URL(response.headers.get("location")!).pathname).toBe("/coach");
    const cookie = response.cookies.get(TEST_SESSION_COOKIE);
    expect(cookie?.value).toContain("empty");
  });
});
