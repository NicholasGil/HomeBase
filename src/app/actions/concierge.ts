"use server";

import { completeConcierge } from "../../../lib/llm";
import { getTestSession } from "@/app/actions/test-session";
import { conciergeFactsForCoach } from "@/lib/concierge-facts-for-coach";
import { clerkBuyerConciergeContext } from "@/lib/concierge-clerk-buyer";
import { isClerkConfigured } from "@/lib/auth-config";
import { OTHER_CLIENT_NAMES } from "@/lib/seed-concierge";

export async function askConcierge(input: {
  question: string;
  discoveryEmpty?: boolean;
}) {
  const session = await getTestSession();
  const discoveryEmpty = input.discoveryEmpty === true;

  if (session !== null && session.role !== "buyer") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }

  if (session?.role === "buyer") {
    const facts = conciergeFactsForCoach({ session, discoveryEmpty });
    if (facts === null) {
      return { ok: false as const, reason: "FORBIDDEN" as const };
    }
    const answer = completeConcierge({
      question: input.question,
      facts,
      otherClientNames: OTHER_CLIENT_NAMES,
    });
    return { ok: true as const, answer };
  }

  if (discoveryEmpty && isClerkConfigured()) {
    const clerkBuyer = await clerkBuyerConciergeContext();
    if (clerkBuyer !== null) {
      if (!clerkBuyer.ok) {
        return { ok: false as const, reason: clerkBuyer.reason };
      }
      if (!clerkBuyer.discoveryEmpty) {
        return { ok: false as const, reason: "FORBIDDEN" as const };
      }
      const facts = conciergeFactsForCoach({ session: null, discoveryEmpty: true });
      if (facts === null) {
        return { ok: false as const, reason: "FORBIDDEN" as const };
      }
      const answer = completeConcierge({
        question: input.question,
        facts,
        otherClientNames: OTHER_CLIENT_NAMES,
      });
      return { ok: true as const, answer };
    }
  }

  if (session === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  return { ok: false as const, reason: "FORBIDDEN" as const };
}

/** @deprecated Use askConcierge */
export async function askSeedConcierge(input: { question: string }) {
  return askConcierge(input);
}
