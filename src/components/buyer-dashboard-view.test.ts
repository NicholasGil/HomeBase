import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  BuyerDashboardViewPanel,
  OwedTodayFigure,
  taskAnchorId,
} from "@/components/buyer-dashboard-view";
import {
  ESTIMATE_AMOUNT_CLASS_NAME,
  ESTIMATE_LABEL,
  ISSUED_AMOUNT_CLASS_NAME,
} from "@/lib/owed-today-display";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";

describe("BuyerDashboardViewPanel ten-second answers", () => {
  it("renders the seeded mid-flight answers and current stage", () => {
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, {
        view: seedDashboardForBuyerA(),
        buyerName: "Alex Rivera",
      }),
    );
    expect(html).toContain('data-testid="ten-second-where"');
    expect(html).toContain("Inspection");
    expect(html).toContain("Sign purchase agreement");
    expect(html).toContain("Schedule inspection");
    expect(html).not.toContain('href="/tours"');
    expect(html).not.toContain('href="/vault"');
    expect(html).not.toContain("#assumptions-panel");
    expect(html).toContain("data-state=\"current\"");
    expect(html).toContain("Cannot leave Inspection");
    expect(html).toContain('data-testid="journey-stage-inspection"');
    expect(html).toContain('data-testid="journey-tracker"');
    expect(html).toContain("814 Maple Ave");
    expect(html.indexOf("h-40")).toBeLessThan(html.indexOf("Inspection"));
  });

  it("drills Next, Due today and every stage chip into the transaction route", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view }),
    );
    const href = `href="/transactions/${view.transactionId}"`;
    const next = /data-testid="ten-second-next".*?<\/section>/.exec(html)?.[0];
    const owe = /data-testid="ten-second-owe".*?<\/section>/.exec(html)?.[0];
    expect(next).toContain(href);
    expect(owe).toContain(href);
    const tracker = /data-testid="journey-tracker".*?<\/ol>/.exec(html)?.[0];
    expect(tracker?.match(new RegExp(href, "g"))).toHaveLength(view.stages.length);
    expect(tracker).toMatch(/<a [^>]*title="Inspection · current stage"/);
    expect(tracker).toContain(" · stage 8 of 13, current stage</span>");
    expect(html).not.toMatch(/<a [^>]*><\/a>/);
  });

  it("renders the hero without self-links on the transaction route", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view, detailHref: null }),
    );
    expect(html).not.toContain(`href="/transactions/${view.transactionId}`);
    expect(html).toContain('data-testid="ten-second-next"');
    expect(html).toContain("Schedule inspection");
    expect(html).toContain('data-testid="journey-stage-inspection"');
  });
});

describe("BuyerDashboardViewPanel stage detail", () => {
  it("links the dashboard gate line to the blocking task's row on the transaction page", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view, detail: "summary" }),
    );
    const gate = /data-testid="stage-blocked".*?<\/p>/.exec(html)?.[0];
    expect(gate).toContain(
      `href="/transactions/${view.transactionId}#${taskAnchorId("Schedule inspection")}"`,
    );
    expect(gate).toContain(">Schedule inspection</a>");
    expect(gate).toContain("Cannot leave Inspection");
  });

  it("renders task rows as static anchored records, not links or buttons", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view, detailHref: null }),
    );
    const rows = /aria-label="Tasks on this stage".*?<\/ul>/.exec(html)?.[0];
    expect(rows).toBeDefined();
    expect(rows).toContain(`id="${taskAnchorId("Schedule inspection")}"`);
    expect(rows).toContain(`id="${taskAnchorId("Review inspection report")}"`);
    expect(rows).toContain('data-task-status="open"');
    expect(rows).toContain('data-task-status="blocked"');
    expect(rows).toContain("blocks advance");
    expect(rows).not.toContain("<a ");
    expect(rows).not.toContain("<button");
    // The transaction page's own gate line stays plain: the task is beside it.
    const gate = /data-testid="stage-blocked".*?<\/p>/.exec(html)?.[0];
    expect(gate).not.toContain("<a ");
    expect(gate).toContain("Schedule inspection");
  });

  it("renders contacts as name and role, with tel and mailto only when supplied", () => {
    const view = seedDashboardForBuyerA();
    const plain = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view, detailHref: null }),
    );
    expect(plain).toContain("Casey Holt");
    expect(plain).not.toContain("tel:");
    expect(plain).not.toContain("mailto:");

    const reachable = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, {
        view,
        detailHref: null,
        contacts: view.contacts.map((contact) => ({
          ...contact,
          phone: "256-555-0100",
          email: "casey.holt@example.com",
        })),
      }),
    );
    expect(reachable).toContain('href="tel:+12565550100"');
    expect(reachable).toContain('href="mailto:casey.holt@example.com"');
    expect(reachable).toContain("Call Casey Holt");
  });

  it("slugs task titles into stable fragment ids", () => {
    expect(taskAnchorId("Schedule inspection")).toBe("task-schedule-inspection");
    expect(taskAnchorId("Review inspection report")).toBe(
      "task-review-inspection-report",
    );
    expect(taskAnchorId("  Order title & survey! ")).toBe(
      "task-order-title-survey",
    );
  });
});

describe("BuyerDashboardViewPanel owedToday", () => {
  it("does not render a dollar amount when owedToday is null", () => {
    const view = { ...seedDashboardForBuyerA(), owedToday: null };
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view }),
    );

    expect(html).toContain("None");
    expect(html).not.toMatch(/\$\d/);
    expect(html).not.toContain("$0.00");
  });

  it("styles estimate and issued amounts differently", () => {
    const issuedHtml = renderToStaticMarkup(
      createElement(OwedTodayFigure, {
        owed: {
          amountCents: 45000,
          currency: "USD",
          provenance: "title_issued",
          asOf: 0,
          label: "Inspection invoice due today",
        },
      }),
    );
    const estimateHtml = renderToStaticMarkup(
      createElement(OwedTodayFigure, {
        owed: {
          amountCents: 120000,
          currency: "USD",
          provenance: "ai_estimate",
          asOf: 0,
        },
      }),
    );
    const enteredHtml = renderToStaticMarkup(
      createElement(OwedTodayFigure, {
        owed: {
          amountCents: 0,
          currency: "USD",
          provenance: "user_entered",
          asOf: 0,
          label: "Nothing due today",
        },
      }),
    );

    expect(issuedHtml).toContain("$450.00");
    expect(issuedHtml).toContain(ISSUED_AMOUNT_CLASS_NAME);
    expect(issuedHtml).toContain("title_issued");
    expect(issuedHtml).not.toContain(ESTIMATE_LABEL);
    expect(issuedHtml).not.toContain(ESTIMATE_AMOUNT_CLASS_NAME);

    expect(estimateHtml).toContain("$1,200.00");
    expect(estimateHtml).toContain(ESTIMATE_LABEL);
    expect(estimateHtml).toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(estimateHtml).toContain("ai_estimate");
    expect(estimateHtml).not.toContain(ISSUED_AMOUNT_CLASS_NAME);

    expect(enteredHtml).toContain("$0.00");
    expect(enteredHtml).toContain(ESTIMATE_LABEL);
    expect(enteredHtml).toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(enteredHtml).toContain("user_entered");
    expect(estimateHtml).not.toBe(issuedHtml);
  });
});
