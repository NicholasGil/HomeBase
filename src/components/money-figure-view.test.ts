import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MoneyFigureView } from "@/components/money-figure-view";
import {
  ESTIMATE_AMOUNT_CLASS_NAME,
  ESTIMATE_LABEL,
  ISSUED_AMOUNT_CLASS_NAME,
} from "@/lib/owed-today-display";
import { moneyFigure } from "../../convex/lib/offerModel";

describe("MoneyFigureView", () => {
  it("labels unofficial figures ESTIMATE and uses the muted estimate style", () => {
    const html = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 32800000,
          provenance: "ai_estimate",
          asOf: 0,
          label: "Estimated loan",
        }),
        testId: "sim-estimatedLoan",
      }),
    );

    expect(html).toContain(ESTIMATE_LABEL);
    expect(html).toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(html).not.toContain(ISSUED_AMOUNT_CLASS_NAME);
    expect(html).toContain("ai_estimate");
    expect(html).toContain("Estimated loan");
  });

  it("keeps issued figures unlabeled and full-weight", () => {
    const html = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 45000,
          provenance: "title_issued",
          asOf: 0,
          label: "Title invoice",
        }),
        testId: "issued-title",
      }),
    );

    expect(html).not.toContain(ESTIMATE_LABEL);
    expect(html).toContain(ISSUED_AMOUNT_CLASS_NAME);
    expect(html).not.toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(html).toContain("title_issued");
    expect(html).toContain("issued");
  });
});
