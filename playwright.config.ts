import { defineConfig, devices } from "@playwright/test";

// A dedicated, non-default port: 3000 is a common convention other local projects
// also bind to, and Playwright's `reuseExistingServer` would silently attach to
// whatever is already listening there — including an unrelated app — rather than
// this repo's own dev server. Fixed and deterministic (no machine-specific
// discovery); override with PLAYWRIGHT_PORT only if this exact port is unavailable.
const PORT = process.env.PLAYWRIGHT_PORT ?? "3417";
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } }
  ],
});
