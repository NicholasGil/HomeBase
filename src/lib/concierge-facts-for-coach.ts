import type { ConciergeFact } from "../../lib/llm/types";
import { discoveryEmptyConciergeFacts } from "../../lib/llm/discoveryEmptyFacts";
import { seedConciergeFacts } from "@/lib/seed-concierge";
import type { TestBuyerSession } from "@/lib/test-session";

export function conciergeFactsForCoach(input: {
  session: TestBuyerSession | null;
  discoveryEmpty: boolean;
}): ConciergeFact[] | null {
  if (input.session?.role === "buyer") {
    return seedConciergeFacts(input.session.clerkId, {
      emptyCoachFile:
        input.session.emptyCoachFile === true || input.discoveryEmpty,
    });
  }
  if (input.discoveryEmpty) {
    return discoveryEmptyConciergeFacts();
  }
  return null;
}
