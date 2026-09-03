import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ListingCardFrame, PhotoTile } from "@/components/listing-card";
import { seedPropertyPhoto } from "@/components/property-photo";

describe("PhotoTile", () => {
  it("renders the fixture photo over the wash when the seed has one", () => {
    const photo = seedPropertyPhoto("4101 Oakwood Ave");
    expect(photo).not.toBeNull();
    const html = renderToStaticMarkup(
      createElement(PhotoTile, { className: "h-24", photo }),
    );
    expect(html).toContain("<img");
    expect(html).toContain('src="/fixtures/properties/4101-oakwood-ave.jpg"');
    expect(html).toContain("Sample photo standing in for 4101 Oakwood Ave");
    expect(html).toContain('data-photo="fixture"');
    expect(html).toMatch(/from-(sand|sage|sky|peach)/);
  });

  it("keeps the wash and house glyph when no photo exists", () => {
    expect(seedPropertyPhoto("1 Nowhere Ln")).toBeNull();
    expect(seedPropertyPhoto(null)).toBeNull();
    const html = renderToStaticMarkup(
      createElement(PhotoTile, {
        className: "h-24",
        photo: seedPropertyPhoto("1 Nowhere Ln"),
      }),
    );
    expect(html).not.toContain("<img");
    expect(html).toContain('data-photo="placeholder"');
    expect(html).toContain("<svg");
  });
});

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

  it("shows the seed photo on a card and keeps the sample label quiet", () => {
    const html = renderToStaticMarkup(
      createElement(ListingCardFrame, {
        testId: "tour-candidate-demo",
        addressLine: "88 Legacy Dr",
        cityState: "Madison, AL",
        sample: true,
        sampleTestId: "tour-sample-label",
        photo: seedPropertyPhoto("88 Legacy Dr"),
      }),
    );

    expect(html).toContain('src="/fixtures/properties/88-legacy-dr.jpg"');
    expect(html).toContain("sample data");
    expect(html).not.toContain("bg-sage ");
  });
});
