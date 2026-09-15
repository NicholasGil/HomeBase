import type { ConciergeFact } from "../../lib/llm/types";
import { discoveryEmptyConciergeFacts } from "../../lib/llm/discoveryEmptyFacts";
import { seedConciergeFacts } from "@/lib/seed-concierge";
import type { TestBuyerSession } from "@/lib/test-session";

/** Fixture Path A facts — empty file comes from session.emptyCoachFile only. */
export function conciergeFactsForCoach(session: TestBuyerSession): ConciergeFact[] {
  if (session.emptyCoachFile === true) {
    return discoveryEmptyConciergeFacts();
  }
  return seedConciergeFacts(session.clerkId);
}
