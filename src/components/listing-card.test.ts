import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ListingCardFrame } from "@/components/listing-card";

describe("ListingCardFrame", () => {
  it("puts the photo tile above the address", () => {
    const html = renderToStaticMarkup(
      createElement(
        ListingCardFrame,
        {
          testId: "search-result-demo",
          propertyId: "seed:listing",
          rank: 1,
          addressLine: "109 Valley Wind Dr",
          cityState: "Owens Cross Roads, AL",
          sample: true,
          sampleTestId: "search-sample-label",
        },
        createElement("p", null, "4 bedrooms, under $450,000"),
      ),
    );

    const photoAt = html.indexOf("aspect-[20/19]");
    const addressAt = html.indexOf("109 Valley Wind Dr");
    expect(photoAt).toBeGreaterThan(-1);
    expect(addressAt).toBeGreaterThan(photoAt);
    expect(html).toContain('data-testid="search-result-demo"');
    expect(html).toContain("sample data");
    expect(html).not.toContain("bg-neutral-200");
    expect(html).not.toContain("from-neutral-300");
    expect(html).not.toContain("via-zinc-200");
    expect(html).not.toContain("to-slate-300");
    expect(html).toMatch(/from-(sand|sage|sky|peach)/);
  });

  it("makes the photo and address a link when href is set", () => {
    const html = renderToStaticMarkup(
      createElement(ListingCardFrame, {
        testId: "search-result-demo",
        propertyId: "seed:listing",
        addressLine: "88 Legacy Dr",
        cityState: "Madison, AL",
        href: "/listings/seed:listing",
      }),
    );

    expect(html).toContain('href="/listings/seed:listing"');
    expect(html).toContain("88 Legacy Dr, Madison, AL");
  });
});
