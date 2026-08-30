"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
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

export async function startTestSession(input: { clerkId: string }) {
  const started = startTestSessionDecision(input.clerkId);
  if (!started.ok) {
    return started;
  }
  const store = await cookies();
  store.set(TEST_SESSION_COOKIE, started.session.clerkId, {
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
  const started = await startTestSession({ clerkId });
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
