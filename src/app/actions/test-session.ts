"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fixtureEntryPath } from "@/lib/demo-copy";
import {
  COACH_SCROLL_EPOCH_COOKIE,
  coachScrollEpochCookieOptions,
  nextCoachScrollEpoch,
} from "@/lib/coach-scroll-epoch";
import {
  DEMO_COACH_SCROLL_RESET_COOKIE,
  demoCoachScrollResetCookieOptions,
  demoCoachScrollResetCookieValue,
} from "@/lib/demo-coach-scroll-reset";
import {
  encodeTestSessionCookie,
  fixtureHomePath,
  parseTestSessionCookie,
  startTestSessionDecision,
  TEST_SESSION_COOKIE,
  testSessionCookieOptions,
  type TestSession,
} from "@/lib/test-session";
import { VENDOR_EXPIRY_COOKIE } from "@/lib/vendor-access";

export async function getTestSession(): Promise<TestSession | null> {
  const store = await cookies();
  return parseTestSessionCookie(store.get(TEST_SESSION_COOKIE)?.value);
}

export async function startTestSession(input: {
  clerkId: string;
  emptyCoachFile?: boolean;
  simulateModelKeyMissing?: boolean;
  simulateConciergeServerError?: boolean;
}) {
  const started = startTestSessionDecision(input.clerkId, process.env, {
    emptyCoachFile: input.emptyCoachFile,
    simulateModelKeyMissing: input.simulateModelKeyMissing,
    simulateConciergeServerError: input.simulateConciergeServerError,
  });
  if (!started.ok) {
    return started;
  }
  const store = await cookies();
  store.set(
    TEST_SESSION_COOKIE,
    encodeTestSessionCookie(started.session),
    testSessionCookieOptions(),
  );
  store.set(
    COACH_SCROLL_EPOCH_COOKIE,
    nextCoachScrollEpoch(),
    coachScrollEpochCookieOptions(),
  );
  store.set(
    DEMO_COACH_SCROLL_RESET_COOKIE,
    demoCoachScrollResetCookieValue(),
    demoCoachScrollResetCookieOptions(),
  );
  if (started.session.role === "vendor") {
    store.delete(VENDOR_EXPIRY_COOKIE);
  }
  return started;
}

export async function startTestSessionFromForm(formData: FormData) {
  const clerkId = formData.get("clerkId");
  if (typeof clerkId !== "string") {
    redirect(fixtureEntryPath());
  }
  const emptyCoachFile = formData.get("emptyCoachFile") === "1";
  const simulateModelKeyMissing =
    formData.get("simulateModelKeyMissing") === "1";
  const simulateConciergeServerError =
    formData.get("simulateConciergeServerError") === "1";
  const started = await startTestSession({
    clerkId,
    emptyCoachFile,
    simulateModelKeyMissing,
    simulateConciergeServerError,
  });
  if (!started.ok) {
    redirect(fixtureEntryPath());
  }
  redirect(fixtureHomePath(started.session));
}

export async function endTestSessionFromForm() {
  const store = await cookies();
  store.delete(TEST_SESSION_COOKIE);
  redirect(fixtureEntryPath());
}
