import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchQueryPill } from "@/components/search-pill";
import { searchPillClassName } from "@/lib/trip-ui";

describe("SearchQueryPill", () => {
  it("renders a single-line capsule with the search test ids", () => {
    const html = renderToStaticMarkup(
      createElement(SearchQueryPill, {
        name: "q",
        defaultValue: "4-bedroom under $450k",
      }),
    );

    expect(html).toContain(searchPillClassName);
    expect(html).toContain("rounded-full");
    expect(html).toContain('data-testid="search-query"');
    expect(html).toContain('data-testid="search-submit"');
    expect(html).toContain("4-bedroom under $450k");
    expect(html).not.toContain("<textarea");
  });
});
