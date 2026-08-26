import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, PORT } from "./tests/e2e/port";

// PORT/BASE_URL: a dedicated, non-default port. 3000 is a common convention other
// local projects also bind to, and Playwright's `reuseExistingServer` would silently
// attach to whatever is already listening there — including an unrelated app —
// rather than this repo's own dev server. Fixed and deterministic (no
// machine-specific discovery); override with PLAYWRIGHT_PORT only if this exact
// port is unavailable. Shared with global-setup.ts via ./tests/e2e/port.ts.

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Fixed at 2, not left to Playwright's CPU-based default: against this repo's
  // `next dev`/Turbopack webServer, enough concurrent first-compiles across workers
  // can trigger a transient RSC "Unexpected end of JSON input" page crash (confirmed
  // reproducible on pre-existing tool pages too, not specific to any one tool).
  // globalSetup below removes the race itself by warming every route serially
  // first; 2 workers keeps a real (if modest) speedup over fully serial. CI stays
  // serial as before.
  workers: process.env.CI ? 1 : 2,
  globalSetup: "./tests/e2e/global-setup.ts",
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
