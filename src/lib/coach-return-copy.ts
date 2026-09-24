import type { BuyerDashboardView } from "../../convex/lib/dashboardView";

export function coachDailyFocusPrompt(): string {
  return "What matters today on this file?";
}

export function coachDailyFocusOptions(
  dashboard: BuyerDashboardView | null,
): readonly string[] {
  if (dashboard?.next?.title) {
    return [
      `Focus: ${dashboard.next.title}`,
      "What changed since I was last here?",
      "What should I do before I log off today?",
    ];
  }
  return [
    "What matters most today?",
    "Help me plan today's buying time",
    "What changed since I was last here?",
  ];
}
