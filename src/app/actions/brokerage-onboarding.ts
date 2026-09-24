"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  encodeFixtureBrokerageCookie,
  FIXTURE_BROKERAGE_COOKIE,
  fixtureInviteCodeForOrg,
  homePathForBrokerageRole,
  type FixtureBrokerageRecord,
} from "@/lib/brokerage-onboarding-fixture";
import { isProductionDeploy } from "@/lib/auth-config";

export async function getFixtureBrokerageRecord(): Promise<FixtureBrokerageRecord | null> {
  const store = await cookies();
  const raw = store.get(FIXTURE_BROKERAGE_COOKIE)?.value;
  if (raw === undefined) {
    return null;
  }
  try {
    return JSON.parse(raw) as FixtureBrokerageRecord;
  } catch {
    return null;
  }
}

export async function createFixtureBrokerageFromForm(formData: FormData) {
  if (isProductionDeploy()) {
    redirect("/test-login");
  }
  const session = await getTestSession();
  if (session === null || session.role !== "onboarding_agent") {
    redirect("/test-login");
  }

  const name = formData.get("name");
  const state = formData.get("state");
  const roleRaw = formData.get("role");
  if (typeof name !== "string" || typeof state !== "string") {
    redirect("/brokerage/onboarding");
  }
  const role = roleRaw === "broker" ? "broker" : "agent";
  const trimmedName = name.trim();
  const trimmedState = state.trim().toUpperCase();
  if (trimmedName.length < 2 || trimmedState.length !== 2) {
    redirect("/brokerage/onboarding");
  }

  const record: FixtureBrokerageRecord = {
    clerkId: session.clerkId,
    orgName: trimmedName,
    orgState: trimmedState,
    role,
    inviteCode: fixtureInviteCodeForOrg(trimmedName),
  };

  const store = await cookies();
  store.set(FIXTURE_BROKERAGE_COOKIE, encodeFixtureBrokerageCookie(record), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(homePathForBrokerageRole(role));
}

export async function joinFixtureBrokerageFromForm(formData: FormData) {
  if (isProductionDeploy()) {
    redirect("/test-login");
  }
  const session = await getTestSession();
  if (session === null || session.role !== "onboarding_agent") {
    redirect("/test-login");
  }

  const inviteCode = formData.get("inviteCode");
  if (typeof inviteCode !== "string") {
    redirect("/brokerage/onboarding");
  }
  const normalized = inviteCode.trim().toUpperCase();
  if (normalized === "LOOKOUT1") {
    const record: FixtureBrokerageRecord = {
      clerkId: session.clerkId,
      orgName: "Lookout Realty",
      orgState: "AL",
      role: "agent",
      inviteCode: normalized,
    };
    const store = await cookies();
    store.set(FIXTURE_BROKERAGE_COOKIE, encodeFixtureBrokerageCookie(record), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/agent");
  }

  redirect("/brokerage/onboarding?join=invalid");
}
