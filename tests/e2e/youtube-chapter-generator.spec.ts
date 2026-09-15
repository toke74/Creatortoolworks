import { expect, test } from "@playwright/test";

test.describe("YouTube Chapter Generator", () => {
  test("builds, validates, sorts, verifies with duration, and copies a chapter list", async ({
    page,
    context,
    browserName,
  }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/youtube-tools/youtube-chapter-generator");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Chapter Generator");

    const rows = page.getByTestId("chapter-rows").getByRole("listitem");
    await expect(rows).toHaveCount(3);
    const results = page.getByTestId("chapter-results");

    await page.getByLabel("Time for chapter 1").fill("00:00");
    await page.getByLabel("Chapter title for chapter 1").fill("Introduction");
    await page.getByLabel("Time for chapter 2").fill("1:35");
    await page.getByLabel("Chapter title for chapter 2").fill("Choosing your topic");
    await page.getByLabel("Time for chapter 3").fill("4:20");
    await page.getByLabel("Chapter title for chapter 3").fill("Recording the video");

    // A valid list with no video duration reads as Ready — missing OPTIONAL
    // information is never a Warning. The final chapter shows as neutral,
    // informational "Not verified" text instead.
    await expect(results.getByText(/ready to copy/i).first()).toBeVisible();
    await expect(results.getByText(/\bwarning\b/i)).toHaveCount(0);
    await expect(results.getByText(/final chapter length: not verified/i)).toBeVisible();

    const copyButton = page.getByRole("button", { name: "Copy chapters" });
    await expect(copyButton).toBeEnabled();

    await page.getByLabel(/video duration/i).fill("10:00");
    await expect(results.getByText(/not verified/i)).toHaveCount(0);
    await expect(results.getByText(/final chapter length: pass/i)).toBeVisible();
    await expect(results.getByText(/ready to copy/i).first()).toBeVisible();

    await copyButton.click();
    await expect(page.getByRole("status")).toContainText(/copied/i);

    if (browserName === "chromium") {
      // Windows normalizes clipboard line endings to CRLF on read-back, so
      // normalize before comparing rather than asserting exact byte equality.
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText.replace(/\r\n/g, "\n")).toBe(
        "00:00 Introduction\n01:35 Choosing your topic\n04:20 Recording the video",
      );
    }

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(rows).toHaveCount(3);
    await expect(page.getByLabel("Time for chapter 1")).toHaveValue("");
  });

  test("loads the example and flags an invalid first timestamp", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-chapter-generator");

    await page.getByRole("button", { name: "Load example" }).click();
    await expect(page.getByTestId("chapter-rows").getByRole("listitem")).toHaveCount(4);
    await expect(page.getByText("00:00 Introduction")).toBeVisible();

    await page.getByLabel("Time for chapter 1").fill("00:05");
    await expect(page.getByTestId("chapter-rows").getByRole("alert").first()).toContainText(/00:00/);

    const copyButton = page.getByRole("button", { name: "Copy chapters" });
    await expect(copyButton).toBeDisabled();
  });

  test("blocks copying on a chapter shorter than 10 seconds", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-chapter-generator");

    await page.getByRole("button", { name: "Load example" }).click();
    await page.getByLabel("Time for chapter 2").fill("0:05");

    await expect(page.getByTestId("chapter-rows").getByText(/at least 10 seconds/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy chapters" })).toBeDisabled();
  });

  test("Load example is fully verified out of the box (duration pre-filled, every check Pass)", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-chapter-generator");
    const results = page.getByTestId("chapter-results");

    await page.getByRole("button", { name: "Load example" }).click();

    await expect(page.getByLabel(/video duration/i)).not.toHaveValue("");
    await expect(results.getByText(/ready to copy/i).first()).toBeVisible();
    await expect(results.getByText(/not verified/i)).toHaveCount(0);
    await expect(results.getByText(/\bwarning\b/i)).toHaveCount(0);
    await expect(results.getByText(/final chapter length: pass/i)).toBeVisible();
    await expect(results.getByText(/known chapter intervals are at least 10 seconds: pass/i)).toBeVisible();

    await expect(page.getByRole("button", { name: "Copy chapters" })).toBeEnabled();
  });

  test("clearing the duration after Load example shows the neutral Not verified info state, still Ready, no alert", async ({
    page,
    context,
    browserName,
  }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/youtube-tools/youtube-chapter-generator");
    const results = page.getByTestId("chapter-results");

    await page.getByRole("button", { name: "Load example" }).click();
    await page.getByLabel(/video duration/i).fill("");

    await expect(results.getByText(/ready to copy/i).first()).toBeVisible();
    await expect(results.getByText(/\bwarning\b/i)).toHaveCount(0);
    await expect(results.getByText(/final chapter length: not verified/i)).toBeVisible();
    // Scoped to <main> — the Next.js dev-mode toolbar renders its own role="alert"
    // live region outside <main>, unrelated to this tool's validation state.
    await expect(page.locator("main").locator('[role="alert"]')).toHaveCount(0);
    await expect(page.getByLabel(/video duration/i)).not.toHaveAttribute("aria-invalid");

    const copyButton = page.getByRole("button", { name: "Copy chapters" });
    await expect(copyButton).toBeEnabled();
    await copyButton.click();
    await expect(page.getByRole("status")).toContainText(/copied/i);
  });

  test("pasting a chapter list drops the initial blank placeholder rows instead of appending after them", async ({
    page,
  }) => {
    await page.goto("/youtube-tools/youtube-chapter-generator");

    const rows = page.getByTestId("chapter-rows").getByRole("listitem");
    await expect(rows).toHaveCount(3);
    await expect(page.getByLabel("Time for chapter 1")).toHaveValue("");

    await page.getByRole("button", { name: "Paste chapter list" }).click();
    await page
      .getByLabel(/paste chapters/i)
      .fill("00:00 Intro\n01:25 Topic\n03:20 Example");
    await page.getByRole("button", { name: "Add lines" }).click();

    // Exactly the 3 pasted rows — no leftover blank rows before or after them.
    await expect(rows).toHaveCount(3);
    await expect(page.getByLabel("Time for chapter 1")).toHaveValue("00:00");
    await expect(page.getByLabel("Chapter title for chapter 1")).toHaveValue("Intro");
    await expect(page.getByLabel("Time for chapter 2")).toHaveValue("01:25");
    await expect(page.getByLabel("Chapter title for chapter 2")).toHaveValue("Topic");
    await expect(page.getByLabel("Time for chapter 3")).toHaveValue("03:20");
    await expect(page.getByLabel("Chapter title for chapter 3")).toHaveValue("Example");
  });

  test("pasting after real rows plus a blank row preserves the real rows and drops only the blank one", async ({
    page,
  }) => {
    await page.goto("/youtube-tools/youtube-chapter-generator");

    await page.getByLabel("Time for chapter 1").fill("00:00");
    await page.getByLabel("Chapter title for chapter 1").fill("Intro");
    await page.getByLabel("Time for chapter 2").fill("01:30");
    await page.getByLabel("Chapter title for chapter 2").fill("Topic");
    // Chapter 3 is left completely blank.

    await page.getByRole("button", { name: "Paste chapter list" }).click();
    await page.getByLabel(/paste chapters/i).fill("03:00 Editing\n05:00 Export");
    await page.getByRole("button", { name: "Add lines" }).click();

    const rows = page.getByTestId("chapter-rows").getByRole("listitem");
    await expect(rows).toHaveCount(4);
    await expect(page.getByLabel("Chapter title for chapter 1")).toHaveValue("Intro");
    await expect(page.getByLabel("Chapter title for chapter 2")).toHaveValue("Topic");
    await expect(page.getByLabel("Time for chapter 3")).toHaveValue("03:00");
    await expect(page.getByLabel("Chapter title for chapter 3")).toHaveValue("Editing");
    await expect(page.getByLabel("Chapter title for chapter 4")).toHaveValue("Export");
  });

  test("pasting a valid chapter list with duration left blank is Ready, not Warning", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-chapter-generator");
    const results = page.getByTestId("chapter-results");

    await page.getByRole("button", { name: "Paste chapter list" }).click();
    await page
      .getByLabel(/paste chapters/i)
      .fill("0:00 Intro\n1:35 - Choosing your topic\n4:20 - Recording the video");
    await page.getByRole("button", { name: "Add lines" }).click();

    await expect(results.getByText(/ready to copy/i).first()).toBeVisible();
    await expect(results.getByText(/\bwarning\b/i)).toHaveCount(0);
    await expect(results.getByText(/final chapter length: not verified/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy chapters" })).toBeEnabled();
  });

  test("errors when the video duration puts the final chapter under 10 seconds", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-chapter-generator");

    await page.getByRole("button", { name: "Load example" }).click();
    await page.getByLabel(/video duration/i).fill("08:15");

    await expect(page.getByTestId("chapter-rows").getByText(/at least 10 seconds/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy chapters" })).toBeDisabled();
  });

  test("has no horizontal overflow on a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/youtube-tools/youtube-chapter-generator");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("live tool is indexable and present in the sitemap", async ({ page, request }) => {
    const response = await page.goto("/youtube-tools/youtube-chapter-generator");
    expect(response?.status()).toBe(200);

    const robotsMeta = await page.locator('meta[name="robots"]').count();
    expect(robotsMeta).toBe(0);

    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonicalHref).toBe("https://creatortoolworks.com/youtube-tools/youtube-chapter-generator");

    const sitemapResponse = await request.get("/sitemap.xml");
    const sitemapBody = await sitemapResponse.text();
    expect(sitemapBody).toContain("youtube-chapter-generator");
  });
});
