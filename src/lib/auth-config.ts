export type AuthEnv = Record<string, string | undefined>;

export const PROTECTED_PATH_PREFIXES = [
  "/app",
  "/dashboard",
  "/transactions",
  "/agent",
  "/broker",
  "/admin",
  "/vendor",
  "/vault",
  "/documents",
  "/tours",
] as const;

export type DashboardRenderMode = "live" | "fixture" | "login" | "unavailable";

export function isProductionDeploy(env: AuthEnv = process.env) {
  return env.VERCEL_ENV === "production";
}

export function clerkKeysPresent(env: AuthEnv = process.env) {
  return Boolean(
    env.CLERK_SECRET_KEY &&
      env.CLERK_SECRET_KEY.length > 0 &&
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0,
  );
}

export function isClerkConfigured(env: AuthEnv = process.env) {
  return clerkKeysPresent(env);
}

export function isConvexConfigured(env: AuthEnv = process.env) {
  return Boolean(env.NEXT_PUBLIC_CONVEX_URL);
}

export function isAuthConfigured(env: AuthEnv = process.env) {
  return clerkKeysPresent(env) && isConvexConfigured(env);
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Vercel production with no Clerk keys. Preview, local, and CI stay open
 * so the labeled seed preview still works. NODE_ENV is ignored on purpose:
 * `next build` and unit tests can be production-mode without being a deploy.
 */
export function mustFailClosed(env: AuthEnv = process.env) {
  return isProductionDeploy(env) && !clerkKeysPresent(env);
}

export type UnauthenticatedAuthAction = "unavailable" | "skip" | "clerk";

/**
 * Production without Clerk keys is always 503. That path never returns
 * "skip", so middleware cannot fall through past auth.protect().
 * Local, CI, and Vercel preview may skip Clerk and use the seed preview.
 */
export function unauthenticatedAuthAction(
  env: AuthEnv = process.env,
): UnauthenticatedAuthAction {
  if (mustFailClosed(env)) {
    return "unavailable";
  }
  if (!clerkKeysPresent(env)) {
    return "skip";
  }
  return "clerk";
}

export function dashboardRenderMode(
  env: AuthEnv = process.env,
  session: { clerkId: string } | null = null,
): DashboardRenderMode {
  if (isAuthConfigured(env)) {
    return "live";
  }
  if (isProductionDeploy(env)) {
    return "unavailable";
  }
  if (session !== null) {
    return "fixture";
  }
  return "login";
}

export class ProductionAuthMisconfiguredError extends Error {
  readonly status = 503;

  constructor() {
    super("Authentication is not configured");
    this.name = "ProductionAuthMisconfiguredError";
  }
}

export function assertCanRenderWithoutAuth(env: AuthEnv = process.env) {
  if (isProductionDeploy(env) && !isAuthConfigured(env)) {
    throw new ProductionAuthMisconfiguredError();
  }
}
