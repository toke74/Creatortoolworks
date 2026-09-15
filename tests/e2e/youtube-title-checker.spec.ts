import { expect, test } from "@playwright/test";

test.describe("YouTube Title Checker", () => {
  test("handles exact boundaries, copy gating, and clipboard output", async ({ page, context, browserName }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }

    await page.goto("/youtube-tools/youtube-title-checker");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Title Checker");

    await expect(page.getByText(/enter or paste a title/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy title" })).toHaveCount(0);

    const textarea = page.getByLabel("Video title");
    await textarea.fill("a".repeat(99));
    const copyButton = page.getByRole("button", { name: "Copy title" });
    await expect(copyButton).toBeEnabled();
    await expect(page.getByText(/99 \/ 100 characters/)).toBeVisible();

    await textarea.fill("a".repeat(100));
    await expect(copyButton).toBeEnabled();
    await expect(page.getByText(/100 \/ 100 characters/)).toBeVisible();

    await textarea.fill("a".repeat(101));
    await expect(page.getByText(/remove 1 character to enable copying/i)).toBeVisible();
    await expect(copyButton).toBeDisabled();

    const exactTitle = "Exact  title 😀";
    await textarea.fill(exactTitle);
    await expect(copyButton).toBeEnabled();
    await copyButton.click();
    await expect(page.getByRole("status")).toContainText(/copied/i);

    if (browserName === "chromium") {
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(exactTitle);
    }
  });

  test("does not auto-normalize spaces and makes cleanup idempotent", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-title-checker");

    const textarea = page.getByLabel("Video title");
    await textarea.fill("My   exact  title");
    await expect(textarea).toHaveValue("My   exact  title");
    await expect(page.getByText(/2 repeated-space runs detected/i)).toBeVisible();

    await page.getByRole("button", { name: "Normalize repeated spaces" }).click();
    await expect(textarea).toHaveValue("My exact title");

    await page.getByRole("button", { name: "Normalize repeated spaces" }).click();
    await expect(page.getByText(/nothing to change/i)).toBeVisible();
    await expect(textarea).toHaveValue("My exact title");
  });

  test("has no horizontal overflow at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/youtube-tools/youtube-title-checker");
    await page.getByLabel("Video title").fill("a".repeat(100));

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("is live and indexable with no noindex and correct canonical", async ({ page }) => {
    const response = await page.goto("/youtube-tools/youtube-title-checker");
    expect(response?.status()).toBe(200);

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://creatortoolworks.com/youtube-tools/youtube-title-checker",
    );
  });

  test("is included in the sitemap alongside existing live tools", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body).toContain("youtube-title-checker");
    expect(body).toContain("thumbnail-size-checker");
    expect(body).toContain("youtube-timestamp-generator");
    expect(body).toContain("youtube-description-formatter");
    expect(body).toContain("youtube-chapter-generator");
  });

  test("existing public tool routes remain healthy", async ({ page }) => {
    for (const route of [
      "/",
      "/youtube-tools",
      "/youtube-tools/thumbnail-size-checker",
      "/youtube-tools/youtube-timestamp-generator",
      "/youtube-tools/youtube-description-formatter",
      "/youtube-tools/youtube-chapter-generator",
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
    }
  });
});
