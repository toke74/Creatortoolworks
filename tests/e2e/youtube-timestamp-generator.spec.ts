import { expect, test } from "@playwright/test";

test.describe("YouTube Timestamp Generator", () => {
  test("builds, validates, sorts, and copies a timestamp list", async ({ page, context, browserName }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/youtube-tools/youtube-timestamp-generator");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Timestamp Generator");

    const rows = page.getByTestId("timestamp-rows").getByRole("listitem");
    await expect(rows).toHaveCount(3);

    await page.getByLabel("Label for row 1").fill("Introduction");
    await expect(page.getByText("00:00 Introduction")).toBeVisible();

    await page.getByLabel("Time for row 2").fill("1:35");
    await page.getByLabel("Label for row 2").fill("What you'll learn");
    await expect(page.getByText("01:35 What you'll learn")).toBeVisible();

    await page.getByRole("button", { name: "+ Add timestamp" }).click();
    await expect(rows).toHaveCount(4);
    await page.getByLabel("Time for row 4").fill("0:10");
    await page.getByLabel("Label for row 4").fill("Out of order");

    await expect(page.getByTestId("timestamp-rows").getByText(/out of order/i)).toBeVisible();

    await page.getByRole("button", { name: "Sort by time" }).click();
    await expect(page.getByLabel("Label for row 1")).toHaveValue("Introduction");
    await expect(page.getByLabel("Label for row 2")).toHaveValue("Out of order");

    await page.getByRole("button", { name: "Copy timestamps" }).click();
    await expect(page.getByRole("status")).toContainText(/copied/i);

    if (browserName === "chromium") {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain("Introduction");
    }

    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(rows).toHaveCount(3);
    await expect(page.getByLabel("Time for row 1")).toHaveValue("00:00");
  });

  test("loads the example list and flags an invalid timestamp", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-timestamp-generator");

    await page.getByRole("button", { name: "Load example" }).click();
    await expect(page.getByTestId("timestamp-rows").getByRole("listitem")).toHaveCount(4);
    await expect(page.getByText("00:00 Introduction")).toBeVisible();

    await page.getByLabel("Time for row 1").fill("1:75");
    await expect(page.getByTestId("timestamp-rows").getByRole("alert")).toContainText("1:75");
  });

  test("blocks copying on an invalid timestamp, and re-enables it once fixed", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-timestamp-generator");

    await page.getByLabel("Label for row 1").fill("Introduction");
    const copyButton = page.getByRole("button", { name: "Copy timestamps" });
    await expect(copyButton).toBeEnabled();

    await page.getByLabel("Time for row 2").fill("1:75");
    await expect(copyButton).toBeDisabled();
    await expect(page.getByText(/fix the invalid timestamp/i)).toBeVisible();

    await page.getByLabel("Time for row 2").fill("1:05");
    await expect(copyButton).toBeEnabled();
    await expect(page.getByText(/fix the invalid timestamp/i)).toHaveCount(0);
  });

  test("still allows copying when only a warning is present", async ({ page, context, browserName }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/youtube-tools/youtube-timestamp-generator");

    await page.getByLabel("Time for row 2").fill("0:00");
    await page.getByLabel("Label for row 2").fill("Also intro");
    await expect(page.getByTestId("timestamp-rows").getByText(/duplicate timestamp/i).first()).toBeVisible();

    const copyButton = page.getByRole("button", { name: "Copy timestamps" });
    await expect(copyButton).toBeEnabled();
    await copyButton.click();
    await expect(page.getByRole("status")).toContainText(/copied/i);
  });

  test("has no horizontal overflow on a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/youtube-tools/youtube-timestamp-generator");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
