import type { ConciergeScope } from "@/components/concierge-sheet";
import {
  COACH_DISCOVERY_EMPTY_ADDRESS,
  COACH_DISCOVERY_STAGE_LABEL,
} from "@/lib/coach-first-session";
import { seedDashboardForBuyer } from "@/lib/seed-dashboard";
import type { TestBuyerSession } from "@/lib/test-session";

export function coachScopeForFixtureBuyer(
  session: TestBuyerSession,
): ConciergeScope {
  if (session.emptyCoachFile) {
    return {
      address: COACH_DISCOVERY_EMPTY_ADDRESS,
      stage: COACH_DISCOVERY_STAGE_LABEL,
    };
  }
  const view = seedDashboardForBuyer(session.clerkId);
  const address = view.propertyAddress;
  return {
    address: address
      ? `${address.line1}, ${address.city}`
      : COACH_DISCOVERY_EMPTY_ADDRESS,
    stage: view.where.label,
  };
}
