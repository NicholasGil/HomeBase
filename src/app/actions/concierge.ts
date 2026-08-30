"use server";

import { completeConcierge } from "../../../lib/llm";
import { getTestSession } from "@/app/actions/test-session";
import { OTHER_CLIENT_NAMES, seedConciergeFacts } from "@/lib/seed-concierge";

export async function askSeedConcierge(input: { question: string }) {
  const session = await getTestSession();
  if (session === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  if (session.role !== "buyer") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  const answer = completeConcierge({
    question: input.question,
    facts: seedConciergeFacts(session.clerkId),
    otherClientNames: OTHER_CLIENT_NAMES,
  });
  return { ok: true as const, answer };
}
