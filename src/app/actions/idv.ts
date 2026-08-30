"use server";

import { getTestSession } from "@/app/actions/test-session";
import {
  attemptFixtureHighRisk,
  loadFixtureIdv,
  type IdvHighRiskAction,
} from "@/lib/idv-access";

export async function loadFixtureIdentity() {
  const session = await getTestSession();
  return loadFixtureIdv(session);
}

export async function attemptHighRiskFromForm(formData: FormData) {
  const action = formData.get("action");
  if (
    action !== "financial_document" &&
    action !== "designated_document" &&
    action !== "account_recovery"
  ) {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  const session = await getTestSession();
  const purpose: IdvHighRiskAction = action;
  return attemptFixtureHighRisk({
    session,
    action: purpose,
  });
}
