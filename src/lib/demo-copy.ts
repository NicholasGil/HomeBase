import { isDemoMode, type AuthEnv } from "@/lib/auth-config";

export const DEMO_CHOOSER_PATH = "/demo" as const;

export function fixtureEntryPath(env: AuthEnv = process.env): string {
  return isDemoMode(env) ? DEMO_CHOOSER_PATH : "/test-login";
}

export function sessionEyebrowLabel(env: AuthEnv = process.env): string {
  return isDemoMode(env)
    ? "Demo session · sample data"
    : "Fixture session · not Clerk";
}

export function fixtureSignInTitle(env: AuthEnv = process.env): string {
  return isDemoMode(env) ? "Explore the RealtyRise demo" : "Fixture sign in";
}

export function fixtureSignInDescription(env: AuthEnv = process.env): string {
  if (isDemoMode(env)) {
    return "Choose a persona below to walk through RealtyRise with sample data. Nothing you do here affects a real account.";
  }
  return "Test-mode login for local, CI, and preview. It is not Clerk. It is disabled when VERCEL_ENV is production.";
}

export function fixtureSignInLinkLabel(env: AuthEnv = process.env): string {
  return isDemoMode(env) ? "Browse demo personas" : "Fixture sign in (preview)";
}

export function fixtureLoginPromptPreviewLabel(env: AuthEnv = process.env): string {
  return isDemoMode(env) ? "Open demo chooser" : "Preview fixture sign in";
}

export function inviteCodeFixtureError(env: AuthEnv = process.env): string {
  return isDemoMode(env)
    ? "Demo invite code not recognized."
    : "Invite code not recognized in this fixture.";
}

export const BUYER_AUTH_DEMO_SIGN_IN_LEAD =
  "Try the live RealtyRise demo with sample data." as const;

export const BUYER_AUTH_DEMO_SIGN_UP_LEAD =
  "Start with the interactive demo—no account required." as const;

export const BUYER_AUTH_DEMO_ENV_TAIL =
  "Pick a persona on the demo chooser to explore buyer coach, agent tools, and more." as const;
