import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CoachHome } from "@/components/coach-home";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";

describe("CoachHome ten-second on file session", () => {
  it("renders the five answers before concierge when a dashboard view is present", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(CoachHome, {
        scope: {
          address: "814 Maple Ave, Huntsville",
          stage: "Inspection",
        },
        buyerName: "Alex Rivera",
        sessionIdentity: "clerk_buyer_a",
        dashboardView: view,
      }),
    );

    expect(html).toContain('data-testid="coach-ten-second"');
    expect(html).toContain('data-testid="ten-second-where"');
    expect(html).toContain('data-testid="ten-second-done"');
    expect(html).toContain('data-testid="coach-concierge-session"');
    expect(html.indexOf('data-testid="coach-ten-second"')).toBeLessThan(
      html.indexOf('data-testid="coach-concierge-session"'),
    );
  });
});
