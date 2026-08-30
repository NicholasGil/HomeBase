import { describe, expect, it } from "vitest";

import {
  assertCanRenderWithoutAuth,
  clerkKeysPresent,
  dashboardRenderMode,
  isProductionDeploy,
  isProtectedPath,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
  unauthenticatedAuthAction,
} from "@/lib/auth-config";

const local = {};
const preview = { VERCEL_ENV: "preview" };
const production = { VERCEL_ENV: "production" };
const keys = {
  CLERK_SECRET_KEY: "sk_test_x",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
};
const configured = {
  ...keys,
  NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
};

describe("production fail-closed", () => {
  it("treats only VERCEL_ENV=production as a production deploy", () => {
    expect(isProductionDeploy(local)).toBe(false);
    expect(isProductionDeploy(preview)).toBe(false);
    expect(isProductionDeploy(production)).toBe(true);
    expect(isProductionDeploy({ VERCEL_ENV: "development" })).toBe(false);
  });

  it("fail-closes production when Clerk keys are missing", () => {
    expect(mustFailClosed(production)).toBe(true);
    expect(mustFailClosed({ ...production, ...keys })).toBe(false);
    expect(mustFailClosed(local)).toBe(false);
    expect(mustFailClosed(preview)).toBe(false);
    expect(mustFailClosed({ ...preview, ...keys })).toBe(false);
  });

  it("never skips Clerk in production when keys are missing", () => {
    expect(unauthenticatedAuthAction(production)).toBe("unavailable");
    expect(unauthenticatedAuthAction(local)).toBe("skip");
    expect(unauthenticatedAuthAction(preview)).toBe("skip");
    expect(unauthenticatedAuthAction({ ...production, ...keys })).toBe("clerk");
    expect(unauthenticatedAuthAction(configured)).toBe("clerk");
    expect(dashboardRenderMode(production)).not.toBe("seed");
  });

  it("does not use NODE_ENV to decide fail-closed", () => {
    expect(mustFailClosed({ VERCEL_ENV: undefined })).toBe(false);
    expect(clerkKeysPresent(local)).toBe(false);
    expect(dashboardRenderMode(local)).toBe("seed");
  });

  it("renders seed locally and on preview, live when configured, 503 in prod", () => {
    expect(dashboardRenderMode(local)).toBe("seed");
    expect(dashboardRenderMode(preview)).toBe("seed");
    expect(dashboardRenderMode({ ...production, ...configured })).toBe("live");
    expect(dashboardRenderMode(production)).toBe("unavailable");
    expect(dashboardRenderMode({ ...production, ...keys })).toBe("unavailable");
  });

  it("throws on protected unauthenticated render in production", () => {
    expect(() => assertCanRenderWithoutAuth(production)).toThrow(
      ProductionAuthMisconfiguredError,
    );
    expect(() => assertCanRenderWithoutAuth(local)).not.toThrow();
  });

  it("marks dashboard and role homes as protected paths", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/transactions/abc")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/sign-in")).toBe(false);
    expect(isProtectedPath("/foundation")).toBe(false);
  });
});
