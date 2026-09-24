import { emptyFixtureCommandCenter } from "@/lib/brokerage-onboarding-fixture";
import { seedCommandCenter } from "@/lib/seed-command-center";
import type { TestSession } from "@/lib/test-session";

export function loadFixtureCommandCenterForViewer(
  session: TestSession,
  record: {
    clerkId: string;
    orgName: string;
    orgState: string;
    role: "agent" | "broker";
  } | null,
) {
  if (record !== null && session.clerkId === record.clerkId) {
    return {
      ok: true as const,
      view: emptyFixtureCommandCenter(),
      orgName: record.orgName,
      role: record.role,
    };
  }
  return null;
}

export function loadSeedCommandCenterForViewer(
  session: TestSession | null,
  now = Date.now(),
) {
  if (session === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  if (session.role === "onboarding_agent") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  if (session.role !== "agent") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return { ok: true as const, view: seedCommandCenter(now) };
}
