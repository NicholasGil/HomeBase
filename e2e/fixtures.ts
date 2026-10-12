import { test as base, expect } from "@playwright/test";

export type { Locator, Page } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, provide, testInfo) => {
    const failures: string[] = [];
    const onPageError = (error: Error) => {
      failures.push(`pageerror: ${error.message}`);
    };
    const onCrash = () => {
      failures.push("page crashed");
    };
    page.on("pageerror", onPageError);
    page.on("crash", onCrash);
    try {
      await provide(page);
    } finally {
      page.off("pageerror", onPageError);
      page.off("crash", onCrash);
      if (failures.length > 0) {
        throw new Error(
          `[${testInfo.title}] ${failures.join("; ")}`,
        );
      }
    }
  },
});

export { expect };
