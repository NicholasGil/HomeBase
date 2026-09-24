"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  encodeTestSessionCookie,
  fixtureHomePath,
  parseTestSessionCookie,
  startTestSessionDecision,
  TEST_SESSION_COOKIE,
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
}) {
  const started = startTestSessionDecision(input.clerkId, process.env, {
    emptyCoachFile: input.emptyCoachFile,
    simulateModelKeyMissing: input.simulateModelKeyMissing,
  });
  if (!started.ok) {
    return started;
  }
  const store = await cookies();
  store.set(TEST_SESSION_COOKIE, encodeTestSessionCookie(started.session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  if (started.session.role === "vendor") {
    store.delete(VENDOR_EXPIRY_COOKIE);
  }
  return started;
}

export async function startTestSessionFromForm(formData: FormData) {
  const clerkId = formData.get("clerkId");
  if (typeof clerkId !== "string") {
    redirect("/test-login");
  }
  const emptyCoachFile = formData.get("emptyCoachFile") === "1";
  const simulateModelKeyMissing =
    formData.get("simulateModelKeyMissing") === "1";
  const started = await startTestSession({
    clerkId,
    emptyCoachFile,
    simulateModelKeyMissing,
  });
  if (!started.ok) {
    redirect("/test-login");
  }
  redirect(fixtureHomePath(started.session));
}

export async function endTestSessionFromForm() {
  const store = await cookies();
  store.delete(TEST_SESSION_COOKIE);
  redirect("/test-login");
}
