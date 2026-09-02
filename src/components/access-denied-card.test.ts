import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AccessDeniedCard,
  homeActionFor,
} from "@/components/access-denied-card";
import { EmptyState } from "@/components/empty-state";

describe("AccessDeniedCard", () => {
  it("keeps the denied test id on the wrapper and says only the neutral line", () => {
    const html = renderToStaticMarkup(
      createElement(AccessDeniedCard, {
        testId: "document-denied",
        title: "You cannot open this document.",
      }),
    );
    expect(html).toMatch(/^<div[^>]*data-testid="document-denied"/);
    const text = html.replace(/<[^>]+>/g, "").trim();
    expect(text).toBe("You cannot open this document.");
    expect(html).not.toContain("<a ");
  });

  it("renders exactly one way back when an action is given", () => {
    const html = renderToStaticMarkup(
      createElement(AccessDeniedCard, {
        testId: "command-center-denied",
        title: "You cannot open the command center.",
        action: homeActionFor("buyer"),
      }),
    );
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("min-h-11");
  });
});

describe("homeActionFor", () => {
  it("sends each role to its own home and never names the refused thing", () => {
    expect(homeActionFor("buyer")).toEqual({
      href: "/dashboard",
      label: "Back to your file",
    });
    expect(homeActionFor("agent").href).toBe("/agent");
    expect(homeActionFor("broker").href).toBe("/agent");
    expect(homeActionFor("vendor")).toEqual({
      href: "/vendor",
      label: "Back to the vendor portal",
    });
    expect(homeActionFor(undefined).href).toBe("/");
  });
});

describe("EmptyState", () => {
  it("keeps the test id on the wrapper, includes the title, and offers one link", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        testId: "search-empty",
        title: 'No sample homes match "Birmingham".',
        description: "Try another city.",
        action: { href: "/search", label: "Try the canonical query" },
      }),
    );
    expect(html).toMatch(/^<div[^>]*data-testid="search-empty"/);
    expect(html).toContain("Birmingham");
    expect(html.match(/<a /g)).toHaveLength(1);
  });
});
