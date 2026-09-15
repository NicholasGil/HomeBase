import type { ConciergeScope } from "@/components/concierge-sheet";

export const COACH_DISCOVERY_EMPTY_ADDRESS = "No property on this file yet";
export const COACH_DISCOVERY_STAGE_LABEL = "Discovery";

export function isCoachDiscoveryEmptyScope(scope: ConciergeScope): boolean {
  return (
    scope.stage === COACH_DISCOVERY_STAGE_LABEL &&
    scope.address === COACH_DISCOVERY_EMPTY_ADDRESS
  );
}

/** Three explain-only prompts for Discovery with no property on file yet. */
export { COACH_FIRST_SESSION_STARTER_LABELS as COACH_FIRST_SESSION_STARTERS } from "../../lib/llm/coachFirstSession";
