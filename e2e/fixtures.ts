import { test as base, expect, type ConsoleMessage } from "@playwright/test";

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
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== "error") {
        return;
      }
      const text = message.text();
      if (
        text.includes("SyntaxError") ||
        text.includes("Unexpected token")
      ) {
        failures.push(`console: ${text}`);
      }
    };
    page.on("pageerror", onPageError);
    page.on("crash", onCrash);
    page.on("console", onConsole);
    try {
      await provide(page);
    } finally {
      page.off("pageerror", onPageError);
      page.off("crash", onCrash);
      page.off("console", onConsole);
      if (failures.length > 0) {
        throw new Error(
          `[${testInfo.title}] ${failures.join("; ")}`,
        );
      }
    }
  },
});

export { expect };
