import type { ConciergeFact } from "../../lib/llm/types";
import { formatDisplayDateTime } from "../../convex/lib/displayTime";
import { SEED_CLERK_IDS, SEED_CONCIERGE } from "../../convex/seedPlan";
import { discoveryEmptyConciergeFacts } from "@/lib/seed-concierge-discovery";
import type { AuthEnv } from "@/lib/auth-config";
import {
  fixtureConciergeInspectionAt,
  fixtureConciergeShowingAt,
} from "@/lib/demo-fixture-dates";
import type { TestBuyerClerkId } from "@/lib/seed-dashboard";

export function seedConciergeFacts(
  clerkId: TestBuyerClerkId,
  options?: {
    emptyCoachFile?: boolean;
    env?: AuthEnv;
    now?: number;
  },
): ConciergeFact[] {
  if (options?.emptyCoachFile) {
    return discoveryEmptyConciergeFacts();
  }
  if (clerkId !== SEED_CLERK_IDS.buyerA) {
    return [
      {
        key: "next",
        text: "Next is Tour Saturday listings, assigned to buyer.",
        source: "tasks",
      },
    ];
  }
  const env = options?.env ?? process.env;
  const now = options?.now ?? Date.now();
  const inspectionAt = fixtureConciergeInspectionAt(env, now);
  const showingAt = fixtureConciergeShowingAt(env, now);

  return [
    {
      key: "next",
      text: "Next is Schedule inspection, assigned to agent.",
      source: "tasks",
    },
    {
      key: "inspection_when",
      text: `Inspection is at ${formatDisplayDateTime(inspectionAt)}.`,
      source: "appointments",
    },
    {
      key: "missing",
      text: "Missing for Inspection: repair_request.",
      source: "journeyStages.requiredDocuments",
    },
    {
      key: "cash",
      text: "Inspection invoice due today",
      source: "transactions.owedToday",
      amountCents: 45000,
      provenance: "title_issued",
    },
    {
      key: "inspection_findings",
      text: "Roof and HVAC need service. No structural defects noted.",
      source: "documents.inspection_report",
    },
    {
      key: "counteroffer",
      text: "Seller countered. Price is now",
      source: "offers",
      amountCents: SEED_CONCIERGE.counterOfferCents,
      provenance: "user_entered",
    },
    {
      key: "lender",
      text: `${SEED_CONCIERGE.lenderName} is the lender on this file.`,
      source: "vendors",
    },
    {
      key: "first_showing",
      text: `Leave for the first showing at ${formatDisplayDateTime(showingAt)}.`,
      source: "appointments",
    },
  ];
}

export const OTHER_CLIENT_NAMES = ["Blair Chen"] as const;
