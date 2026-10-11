import { describe, expect, it } from "vitest";

import {
  assertCanRenderWithoutAuth,
  clerkKeysPresent,
  dashboardRenderMode,
  fixtureAllowed,
  isDemoMode,
  isProductionDeploy,
  isProtectedPath,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
  unauthenticatedAuthAction,
} from "@/lib/auth-config";

const local = {};
const preview = { VERCEL_ENV: "preview" };
const production = { VERCEL_ENV: "production" };
const demoProduction = { VERCEL_ENV: "production", REALTYRISE_DEMO_MODE: "1" };
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
    expect(dashboardRenderMode(local)).toBe("login");
  });

  it("renders login or fixture locally, live when configured, 503 in prod", () => {
    expect(dashboardRenderMode(local)).toBe("login");
    expect(dashboardRenderMode(preview)).toBe("login");
    expect(
      dashboardRenderMode(local, { clerkId: "clerk_buyer_a" }),
    ).toBe("fixture");
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

  it("enables public demo mode only without Clerk keys", () => {
    expect(isDemoMode(demoProduction)).toBe(true);
    expect(isDemoMode({ ...demoProduction, ...keys })).toBe(false);
    expect(fixtureAllowed(demoProduction)).toBe(true);
    expect(fixtureAllowed(production)).toBe(false);
    expect(mustFailClosed(demoProduction)).toBe(false);
    expect(unauthenticatedAuthAction(demoProduction)).toBe("skip");
    expect(dashboardRenderMode(demoProduction)).toBe("login");
    expect(
      dashboardRenderMode(demoProduction, { clerkId: "clerk_buyer_a" }),
    ).toBe("fixture");
    expect(dashboardRenderMode(demoProduction)).not.toBe("unavailable");
    expect(() => assertCanRenderWithoutAuth(demoProduction)).not.toThrow();
  });

  it("keeps production fail-closed when demo flag is unset", () => {
    expect(isDemoMode(production)).toBe(false);
    expect(mustFailClosed(production)).toBe(true);
    expect(unauthenticatedAuthAction(production)).toBe("unavailable");
    expect(dashboardRenderMode(production)).toBe("unavailable");
  });

  it("marks dashboard and role homes as protected paths", () => {
    expect(isProtectedPath("/coach")).toBe(true);
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/vault")).toBe(true);
    expect(isProtectedPath("/tours")).toBe(true);
    expect(isProtectedPath("/tours/abc")).toBe(true);
    expect(isProtectedPath("/offers")).toBe(true);
    expect(isProtectedPath("/offers/abc")).toBe(true);
    expect(isProtectedPath("/sign")).toBe(true);
    expect(isProtectedPath("/identity")).toBe(true);
    expect(isProtectedPath("/search")).toBe(true);
    expect(isProtectedPath("/listings")).toBe(true);
    expect(isProtectedPath("/listings/abc")).toBe(true);
    expect(isProtectedPath("/homeownership")).toBe(true);
    expect(isProtectedPath("/homeownership/abc")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/documents/abc")).toBe(true);
    expect(isProtectedPath("/transactions/abc")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/sign-in")).toBe(false);
    expect(isProtectedPath("/foundation")).toBe(false);
  });
});
