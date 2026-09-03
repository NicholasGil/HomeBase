import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ContactReach,
  mailtoHref,
  telHref,
} from "@/components/contact-links";

describe("telHref", () => {
  it("dials a ten-digit fixture number with the North American prefix", () => {
    expect(telHref("256-555-0100")).toBe("tel:+12565550100");
    expect(telHref("(256) 555-0100")).toBe("tel:+12565550100");
  });

  it("keeps an explicit country code and strips formatting otherwise", () => {
    expect(telHref("+44 20 7946 0958")).toBe("tel:+442079460958");
    expect(telHref("1-256-555-0100")).toBe("tel:12565550100");
  });
});

describe("mailtoHref", () => {
  it("trims the address", () => {
    expect(mailtoHref(" casey.holt@example.com ")).toBe(
      "mailto:casey.holt@example.com",
    );
  });
});

describe("ContactReach", () => {
  it("renders phone and email as tel and mailto links that name the person", () => {
    const html = renderToStaticMarkup(
      createElement(ContactReach, {
        name: "Casey Holt",
        phone: "256-555-0100",
        email: "casey.holt@example.com",
      }),
    );
    expect(html).toContain('href="tel:+12565550100"');
    expect(html).toContain('href="mailto:casey.holt@example.com"');
    expect(html).toContain('aria-label="Call Casey Holt at 256-555-0100"');
    expect(html).toContain(
      'aria-label="Email Casey Holt at casey.holt@example.com"',
    );
    expect(html).toContain(">256-555-0100<");
    expect(html).toContain(">casey.holt@example.com<");
    expect(html.match(/min-h-11/g)).toHaveLength(2);
  });

  it("renders only the value it has and nothing without either", () => {
    const phoneOnly = renderToStaticMarkup(
      createElement(ContactReach, { name: "Riley Brooks", phone: "256-555-0140" }),
    );
    expect(phoneOnly).toContain("tel:");
    expect(phoneOnly).not.toContain("mailto:");

    expect(
      renderToStaticMarkup(createElement(ContactReach, { name: "Nobody" })),
    ).toBe("");
  });
});
