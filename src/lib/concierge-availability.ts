import type { AuthEnv } from "@/lib/auth-config";
import type { TestSession } from "@/lib/test-session";
import {
  conciergeModelKeyPresent,
} from "../../lib/llm/modelConfig";

export type ConciergeAvailability = "ready" | "model_key_missing";

export type ConciergeUnavailableReason = "MODEL_KEY_NOT_CONFIGURED";

/**
 * Fixture test buyers use rule-based lib/llm answers and do not need a provider
 * key. Clerk / live coach requires a configured model key unless the fixture
 * session opts into simulating a missing key (proof + e2e).
 */
export function conciergeAvailability(
  session: TestSession | null,
  env: AuthEnv = process.env,
): ConciergeAvailability {
  if (session?.role === "buyer") {
    if (session.simulateModelKeyMissing) {
      return "model_key_missing";
    }
    return "ready";
  }
  if (conciergeModelKeyPresent(env)) {
    return "ready";
  }
  return "model_key_missing";
}
