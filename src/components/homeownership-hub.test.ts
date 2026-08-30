import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomeownershipHubView } from "@/components/homeownership-hub";
import { seedHomeownershipHub } from "@/lib/seed-homeownership";
import { MISSING_OWED_TODAY_TEXT } from "@/lib/owed-today-display";

describe("HomeownershipHubView", () => {
  it("renders the four surfaces and never paints a missing value as $0.00", () => {
    const html = renderToStaticMarkup(
      createElement(HomeownershipHubView, {
        view: seedHomeownershipHub(),
      }),
    );
    expect(html).toContain("homeownership-hub");
    expect(html).toContain("hub-maintenance");
    expect(html).toContain("hub-warranties");
    expect(html).toContain("hub-values");
    expect(html).toContain("hub-vendors");
    expect(html).toContain("Replace HVAC filter");
    expect(html).toContain("HVAC manufacturer warranty");
    expect(html).toContain("title_issued");
    expect(html).toContain("ai_estimate");
    expect(html).toContain("ESTIMATE");
    expect(html).toContain("Compensation: none");
    expect(html).not.toContain("Pay");
    expect(html).toContain(MISSING_OWED_TODAY_TEXT);
    const taxBlock = html.split("hub-value-taxAssessed")[1] ?? "";
    expect(taxBlock).toContain("None");
    expect(taxBlock).not.toContain("$0.00");
    expect(html).not.toContain("extractedSummary");
  });
});
