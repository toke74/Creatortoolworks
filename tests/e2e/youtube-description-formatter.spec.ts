import { expect, test } from "@playwright/test";

test.describe("YouTube Description Formatter", () => {
  test("shows live counts, blocks copying over the limit, and re-enables it when fixed", async ({
    page,
    context,
    browserName,
  }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/youtube-tools/youtube-description-formatter");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Description Formatter");

    const textarea = page.getByLabel("Video description");
    await textarea.fill("Watch here https://example.com\n#shorts #editing");

    await expect(page.getByText(/47 \/ 5,000 characters/)).toBeVisible();

    const copyButton = page.getByRole("button", { name: "Copy description" });
    await expect(copyButton).toBeEnabled();

    await textarea.fill("a".repeat(5001));
    await expect(page.getByText(/remove 1 character to enable copying/i)).toBeVisible();
    await expect(copyButton).toBeDisabled();

    await textarea.fill("a".repeat(5000));
    await expect(copyButton).toBeEnabled();

    await copyButton.click();
    await expect(page.getByRole("status")).toContainText(/copied/i);

    if (browserName === "chromium") {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toHaveLength(5000);
    }
  });

  test("loads the example description and applies safe cleanup", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-description-formatter");

    await page.getByRole("button", { name: "Load example" }).click();
    const textarea = page.getByLabel("Video description");
    await expect(textarea).toHaveValue(/Learn how to edit vertical video/);

    await page.getByRole("button", { name: "Apply all safe cleanup" }).click();
    await expect(page.getByText(/removed \d+ characters?/i)).toBeVisible();

    const cleanedValue = await textarea.inputValue();
    expect(cleanedValue.startsWith("\n")).toBe(false);
    expect(cleanedValue.endsWith("\n")).toBe(false);
    expect(cleanedValue).toContain("https://example.com/tutorial");
    expect(cleanedValue).toContain("#shorts #videoediting");
  });

  test("clears the description on Clear", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-description-formatter");

    const textarea = page.getByLabel("Video description");
    await textarea.fill("Some description text");
    await expect(textarea).not.toHaveValue("");

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(textarea).toHaveValue("");
  });

  test("has no horizontal overflow on a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/youtube-tools/youtube-description-formatter");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("a long unbroken token (no spaces) does not blow out the mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/youtube-tools/youtube-description-formatter");

    // A single unbreakable "word" has no whitespace to wrap on; without an
    // explicit word-break rule, CSS Grid's default `min-width: auto` lets a
    // form control's content force its whole grid track wider than the
    // viewport (a real Grid/Flexbox gotcha, not just a Playwright quirk).
    await page.getByLabel("Video description").fill("a".repeat(5000));

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    const copyButton = page.getByRole("button", { name: "Copy description" });
    await copyButton.scrollIntoViewIfNeeded();
    const box = await copyButton.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    await expect(copyButton).toBeEnabled();
    await copyButton.click();
  });

  test("is noindex while in draft status", async ({ page }) => {
    const response = await page.goto("/youtube-tools/youtube-description-formatter");
    expect(response?.status()).toBe(200);

    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute("content", /noindex/);
    await expect(robotsMeta).toHaveAttribute("content", /follow/);
  });

  test("is excluded from the sitemap while draft, unlike the two live tools", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body).not.toContain("youtube-description-formatter");
    expect(body).toContain("thumbnail-size-checker");
    expect(body).toContain("youtube-timestamp-generator");
  });
});
