import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

// Start `pnpm preview` first, then use PLAYWRIGHT_PORT=8787. Reuse the same
// behavior, privacy, SEO, responsive, screenshot and live-tool regression checks
// against the real local OpenNext/Workers runtime without starting Next dev.
export default defineConfig({
  ...config,
  webServer: undefined,
  testMatch: "**/youtube-thumbnail-title-previewer.spec.ts",
  reporter: "list",
});
