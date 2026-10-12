import { defineConfig, devices } from "@playwright/test";

const demoSuite = process.env.PLAYWRIGHT_DEMO_SUITE === "1";

export default defineConfig({
  testDir: demoSuite ? "./e2e/demo-mode" : "./e2e",
  testIgnore: demoSuite ? [] : ["**/demo-mode/**"],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: demoSuite
      ? `env VERCEL_ENV=production REALTYRISE_DEMO_MODE=1 npm run dev -- --hostname localhost --port 3000`
      : `env VERCEL_ENV=preview REALTYRISE_DEMO_MODE=${process.env.REALTYRISE_DEMO_MODE ?? "0"} npm run dev -- --hostname localhost --port 3000`,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
