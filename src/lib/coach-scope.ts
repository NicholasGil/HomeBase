import type { ConciergeScope } from "@/components/concierge-sheet";

type BuyerDashboardLike = {
  propertyAddress: {
    line1: string;
    city: string;
  } | null;
  where: { label: string };
};

export function coachScopeForBuyerDashboard(
  dashboard: BuyerDashboardLike | null,
): ConciergeScope {
  if (dashboard === null) {
    return {
      address: "No property on this file yet",
      stage: "Discovery",
    };
  }
  const address = dashboard.propertyAddress;
  return {
    address: address
      ? `${address.line1}, ${address.city}`
      : "No property on this file yet",
    stage: dashboard.where.label,
  };
}
