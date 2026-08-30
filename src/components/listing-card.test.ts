import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ListingCardFrame } from "@/components/listing-card";

describe("ListingCardFrame", () => {
  it("puts the photo tile above the address", () => {
    const html = renderToStaticMarkup(
      createElement(ListingCardFrame, {
        testId: "search-result-demo",
        propertyId: "seed:listing",
        rank: 1,
        addressLine: "109 Valley Wind Dr",
        cityState: "Owens Cross Roads, AL",
        sample: true,
        sampleTestId: "search-sample-label",
        children: createElement("p", null, "4 bedrooms, under $450,000"),
      }),
    );

    const photoAt = html.indexOf("aspect-[20/19]");
    const addressAt = html.indexOf("109 Valley Wind Dr");
    expect(photoAt).toBeGreaterThan(-1);
    expect(addressAt).toBeGreaterThan(photoAt);
    expect(html).toContain('data-testid="search-result-demo"');
    expect(html).toContain("sample data");
  });
});
