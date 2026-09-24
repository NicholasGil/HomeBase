import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { emptyCommandCenterView } from "../../convex/lib/commandCenter";
import type { CommandCenterView } from "../../convex/lib/commandCenter";

export const FIXTURE_BROKERAGE_COOKIE = "hb_fixture_brokerage";

export type FixtureBrokerageRecord = {
  clerkId: string;
  orgName: string;
  orgState: string;
  role: "agent" | "broker";
  inviteCode: string;
};

export function isOnboardingAgentClerkId(value: string) {
  return value === SEED_CLERK_IDS.onboardingAgent;
}

export function parseFixtureBrokerageCookie(
  value: string | undefined,
): FixtureBrokerageRecord | null {
  if (value === undefined || value.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as FixtureBrokerageRecord;
    if (
      typeof parsed.clerkId !== "string" ||
      typeof parsed.orgName !== "string" ||
      typeof parsed.orgState !== "string" ||
      (parsed.role !== "agent" && parsed.role !== "broker") ||
      typeof parsed.inviteCode !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function encodeFixtureBrokerageCookie(record: FixtureBrokerageRecord) {
  return JSON.stringify(record);
}

export function fixtureInviteCodeForOrg(orgName: string) {
  const slug = orgName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return `${slug || "RR"}${Math.floor(Math.random() * 900 + 100)}`;
}

export function emptyFixtureCommandCenter(): CommandCenterView {
  return emptyCommandCenterView();
}

export function homePathForBrokerageRole(role: "agent" | "broker") {
  return role === "broker" ? "/broker" : "/agent";
}
