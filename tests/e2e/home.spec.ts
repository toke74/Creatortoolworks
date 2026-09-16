import { expect, test } from "@playwright/test";

test("home page links to the tools that are actually usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Practical tools for creators.");
  await expect(page.getByRole("link", { name: "Thumbnail Size Checker" })).toBeVisible();
  await expect(page.getByRole("link", { name: "YouTube Title Checker" })).toBeVisible();
  await expect(page.getByRole("link", { name: "YouTube Earnings Estimator" })).toBeVisible();
});

test("tool catalog page shows tools that are implemented for visitor QA", async ({ page }) => {
  await page.goto("/youtube-tools");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Creator Tools");
  await expect(page.getByRole("link", { name: "Thumbnail Size Checker" })).toBeVisible();
  await expect(page.getByRole("link", { name: "YouTube Title Checker" })).toBeVisible();
  await expect(page.getByRole("link", { name: "YouTube Earnings Estimator" })).toBeVisible();
});
