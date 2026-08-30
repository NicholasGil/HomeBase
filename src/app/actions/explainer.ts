"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  FIXTURE_AGENT_THREAD_COOKIE,
  askFixtureSection,
  loadFixtureSections,
  parseFixtureAgentThread,
  type FixtureAgentThread,
} from "@/lib/explainer-access";

async function readThread(): Promise<FixtureAgentThread> {
  const store = await cookies();
  return parseFixtureAgentThread(store.get(FIXTURE_AGENT_THREAD_COOKIE)?.value);
}

async function writeThread(thread: FixtureAgentThread) {
  const store = await cookies();
  store.set(FIXTURE_AGENT_THREAD_COOKIE, JSON.stringify(thread), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function loadFixtureExplainer() {
  const session = await getTestSession();
  const sections = loadFixtureSections(session);
  const thread = await readThread();
  return { session, sections, thread };
}

export async function askAboutSectionFromForm(formData: FormData) {
  const sectionId = formData.get("sectionId");
  if (typeof sectionId !== "string") {
    redirect("/offers?notice=denied");
  }
  const session = await getTestSession();
  const result = askFixtureSection({
    session,
    sectionId,
    thread: await readThread(),
  });
  if (!result.ok) {
    redirect("/offers?notice=denied");
  }
  await writeThread(result.thread);
  redirect("/offers");
}
