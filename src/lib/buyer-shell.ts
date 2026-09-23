export type BuyerLockedArea = "search" | "tours" | "pipeline" | "vault";

export type BuyerLockedUpsell = {
  area: BuyerLockedArea;
  href: string;
  label: string;
  title: string;
  description: string;
  bullets: readonly string[];
};

export const BUYER_COACH_HOME = "/coach" as const;

/** Shared on pricing + route gates — not repeated on every upsell card. */
export const BUYER_LOCKED_OS_PAYMENT_DISCLAIMER =
  "No payment is taken here. Your agent or brokerage enables these areas when you are ready for the full transaction OS.";

export const BUYER_LOCKED_UPSELLS: readonly BuyerLockedUpsell[] = [
  {
    area: "search",
    href: "/search",
    label: "Search",
    title: "Property search",
    description:
      "Browse listings, save homes, and compare neighborhoods in one place. This slice of RealtyRise is not turned on for your account yet.",
    bullets: [
      "Map-first search with drive times",
      "Saved homes tied to your file",
      "Share shortlists with your agent",
    ],
  },
  {
    area: "tours",
    href: "/tours",
    label: "Tours",
    title: "Unlock tours",
    description:
      "Build a showing route, reorder stops, and log verdicts after each home. The tour scheduler is part of the full buyer OS — not turned on for your account yet.",
    bullets: [
      "Optimized drive order between listings",
      "Showing windows and departure reminders",
      "Love / maybe / no feedback per stop",
    ],
  },
  {
    area: "pipeline",
    href: "/dashboard",
    label: "Pipeline",
    title: "Transaction pipeline",
    description:
      "The ten-second dashboard, journey stages, and task rail live here. You stay on your personal coach until your brokerage unlocks the full OS.",
    bullets: [
      "Where you are in the journey",
      "What is done and what is next",
      "Who you are waiting on today",
    ],
  },
  {
    area: "vault",
    href: "/vault",
    label: "Vault",
    title: "Document vault",
    description:
      "Grants, uploads, and closing packets stay in a permissioned vault. Vault access ships with the full buyer OS — not a separate charge in this preview.",
    bullets: [
      "Upload and review contracts",
      "Controlled sharing with vendors",
      "Audit trail on every view",
    ],
  },
] as const;

export function buyerLockedUpsell(area: BuyerLockedArea): BuyerLockedUpsell {
  const match = BUYER_LOCKED_UPSELLS.find((row) => row.area === area);
  if (match === undefined) {
    throw new Error(`unknown locked area: ${area}`);
  }
  return match;
}
