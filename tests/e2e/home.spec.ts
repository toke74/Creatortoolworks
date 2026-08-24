import { expect, test } from "@playwright/test";

test("home page links to the tools that are actually usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Practical tools for creators.");
  await expect(page.getByRole("link", { name: "Thumbnail Size Checker" })).toBeVisible();
  // Tools without a working implementation yet must not be surfaced to visitors.
  await expect(page.getByRole("link", { name: "YouTube Title Analyzer" })).toHaveCount(0);
});

test("tool catalog page hides tools that aren't implemented yet", async ({ page }) => {
  await page.goto("/youtube-tools");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Creator Tools");
  await expect(page.getByRole("link", { name: "Thumbnail Size Checker" })).toBeVisible();
  await expect(page.getByRole("link", { name: "YouTube Title Analyzer" })).toHaveCount(0);
});
