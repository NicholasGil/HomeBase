import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DONE_PREVIEW_COUNT, DoneList } from "@/components/done-list";

describe("DoneList", () => {
  it("shows every item when there are at most two", () => {
    const html = renderToStaticMarkup(
      createElement(DoneList, { items: ["Sign purchase agreement", "Submit earnest money"] }),
    );
    expect(html).toContain("Sign purchase agreement");
    expect(html).toContain("Submit earnest money");
    expect(html).not.toContain("more");
    expect(html).not.toContain("<button");
  });

  it("truncates to two items and offers the remainder count", () => {
    const items = ["One", "Two", "Three", "Four", "Five"];
    const html = renderToStaticMarkup(createElement(DoneList, { items }));
    expect(DONE_PREVIEW_COUNT).toBe(2);
    expect(html).toContain("One");
    expect(html).toContain("Two");
    expect(html).not.toContain("Three");
    expect(html).toContain("3 more");
    expect(html).toContain('aria-expanded="false"');
  });

  it("says nothing is done yet for an empty list", () => {
    const html = renderToStaticMarkup(createElement(DoneList, { items: [] }));
    expect(html).toContain("Nothing marked done yet.");
    expect(html).not.toContain("<ul");
  });
});
