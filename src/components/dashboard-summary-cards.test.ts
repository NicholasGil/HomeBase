import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import {
  DashboardSummaryCards,
  summaryCardsFor,
} from "@/components/dashboard-summary-cards";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";

describe("DashboardSummaryCards", () => {
  it("links to the four route surfaces without inlining them", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(DashboardSummaryCards, { view }),
    );
    expect(html).toContain('data-testid="dashboard-summary-cards"');
    expect(html).toContain('href="/tours"');
    expect(html).toContain('href="/offers"');
    expect(html).toContain('href="/vault"');
    expect(html).toContain(`href="/transactions/${view.transactionId}"`);
    expect(html).not.toContain('data-testid="tour-builder"');
    expect(html).not.toContain('data-testid="offer-center"');
    expect(html).not.toContain('data-testid="document-vault"');
  });

  it("describes each route from the ten-second view only", () => {
    const view = seedDashboardForBuyerA();
    const cards = summaryCardsFor(view);
    expect(cards.map((card) => card.key)).toEqual([
      "tours",
      "offers",
      "vault",
      "transaction",
    ]);
    expect(cards[0]?.detail).toBe("Next: Schedule inspection.");
    expect(cards[2]?.detail).toBe("Inspection invoice due today.");
    expect(cards[3]?.title).toBe("Inspection");
    expect(cards[3]?.badge).toBe("advance blocked");
    expect(JSON.stringify(cards)).not.toMatch(/\$\d/);
  });
});

describe("BuyerDashboardViewPanel detail=summary", () => {
  it("keeps the advance gate and drops the three stage columns", () => {
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, {
        view: seedDashboardForBuyerA(),
        detail: "summary",
      }),
    );
    expect(html).toContain('data-testid="stage-blocked"');
    expect(html).toContain("Cannot leave Inspection");
    expect(html).toContain("Inspection due");
    expect(html).not.toContain("This stage");
    expect(html).not.toContain("Contacts");
  });
});
