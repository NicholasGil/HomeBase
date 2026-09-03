import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JourneyTracker } from "@/components/journey-tracker";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";

function stageMarkup(html: string, key: string) {
  const match = new RegExp(
    `<li[^>]*data-testid="journey-stage-${key}"[^>]*>.*?</li>`,
  ).exec(html);
  if (match === null) {
    throw new Error(`stage ${key} not rendered`);
  }
  return match[0];
}

describe("JourneyTracker", () => {
  const stages = seedDashboardForBuyerA().stages;
  const html = renderToStaticMarkup(createElement(JourneyTracker, { stages }));

  it("keeps the rail and per-stage test ids with their state in DOM order", () => {
    expect(html).toContain('data-testid="journey-tracker"');
    const keys = [...html.matchAll(/data-testid="journey-stage-([a-z_]+)"/g)].map(
      (match) => match[1],
    );
    expect(keys).toEqual(stages.map((stage) => stage.key));
    expect(stageMarkup(html, "inspection")).toContain('data-state="current"');
    expect(stageMarkup(html, "under_contract")).toContain(
      'data-state="complete"',
    );
    expect(stageMarkup(html, "appraisal")).toContain('data-state="upcoming"');
  });

  it("shows labels only for the current stage and its neighbours", () => {
    const visible = (key: string) => {
      const label = stages.find((stage) => stage.key === key)?.label ?? "";
      return !new RegExp(`<span class="sr-only[^"]*">${label}</span>`).test(
        stageMarkup(html, key),
      );
    };
    expect(visible("under_contract")).toBe(true);
    expect(visible("inspection")).toBe(true);
    expect(visible("appraisal")).toBe(true);
    expect(visible("negotiation")).toBe(false);
    expect(visible("title")).toBe(false);
    expect(visible("discovery")).toBe(false);
  });

  it("marks the current stage as the one tab stop with aria-current", () => {
    expect(stageMarkup(html, "inspection")).toContain('tabindex="0"');
    expect(stageMarkup(html, "inspection")).toContain('aria-current="step"');
    expect(stageMarkup(html, "appraisal")).toContain('tabindex="-1"');
    expect(stageMarkup(html, "appraisal")).not.toContain("aria-current");
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it("renders no anchors without an href and one named link per stage with it", () => {
    expect(html).not.toContain("<a ");

    const linked = renderToStaticMarkup(
      createElement(JourneyTracker, { stages, href: "/transactions/seed:buyer-a" }),
    );
    expect(linked.match(/<a /g)).toHaveLength(stages.length);
    expect(linked.match(/href="\/transactions\/seed:buyer-a"/g)).toHaveLength(
      stages.length,
    );
    expect(linked).not.toMatch(/<a [^>]*><\/a>/);
    const inspection = stageMarkup(linked, "inspection");
    expect(inspection).toMatch(/<a [^>]*tabindex="0"/);
    expect(inspection).toContain("Inspection</span>");
    expect(inspection).toContain(" · stage 8 of 13, current stage</span>");
    expect(stageMarkup(linked, "appraisal")).toMatch(/<a [^>]*tabindex="-1"/);
    expect(linked.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it("gives every stage a 44px hit area and only the responsive rail a vertical lg form", () => {
    expect(stageMarkup(html, "title")).toContain("min-h-11");
    expect(stageMarkup(html, "title")).toContain("w-11");
    expect(html).not.toContain("lg:flex-col");

    const responsive = renderToStaticMarkup(
      createElement(JourneyTracker, { stages, orientation: "responsive" }),
    );
    expect(responsive).toContain('data-orientation="responsive"');
    expect(responsive).toContain("lg:flex-col");
    expect(stageMarkup(responsive, "title")).toContain("lg:not-sr-only");
  });
});
