import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { homeActionFor } from "@/components/access-denied-card";
import { ListingDenied } from "@/components/listing-detail";

describe("ListingDenied", () => {
  it("keeps listing-denied on the wrapper, says the neutral line, and offers one way back", () => {
    const html = renderToStaticMarkup(
      createElement(ListingDenied, { action: homeActionFor("vendor") }),
    );
    expect(html).toMatch(/^<div[^>]*data-testid="listing-denied"/);
    expect(html).toContain("You cannot open this listing.");
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="/vendor"');
    expect(html).toContain("Back to the vendor portal");
    expect(html).not.toContain("88 Legacy Dr");
  });

  it("stays a single sentence with no link when no action is given", () => {
    const html = renderToStaticMarkup(createElement(ListingDenied, {}));
    const text = html.replace(/<[^>]+>/g, "").trim();
    expect(text).toBe("You cannot open this listing.");
    expect(html).not.toContain("<a ");
  });
});
