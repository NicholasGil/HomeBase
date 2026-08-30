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

export async function getTestSession(): Promise<TestSession | null> {
  const store = await cookies();
  return parseTestSessionCookie(store.get(TEST_SESSION_COOKIE)?.value);
}

export async function startTestSession(input: { clerkId: string }) {
  const started = startTestSessionDecision(input.clerkId);
  if (!started.ok) {
    throw new Error(started.reason);
  }
  const store = await cookies();
  store.set(TEST_SESSION_COOKIE, started.session.clerkId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return started.session;
}

export async function startTestSessionFromForm(formData: FormData) {
  const clerkId = formData.get("clerkId");
  if (typeof clerkId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await startTestSession({ clerkId });
  redirect(fixtureHomePath(session));
}
