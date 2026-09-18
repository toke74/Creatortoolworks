import { expect, type Page, test } from "@playwright/test";

const makeTags = (count: number) => Array.from({ length: count }, (_, index) => `#tag${index}`).join(" ");

async function waitForHydrationBeforeScreenshot(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Hashtag Checker");
  const textarea = page.getByLabel("Paste title, description, or hashtag text");
  await expect(textarea).toBeVisible();
  await textarea.blur();
  await page.waitForTimeout(500);
}

test.describe("YouTube Hashtag Checker", () => {
  test("handles neutral, ready, error, cleanup, and exact clipboard output", async ({ page, context, browserName }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }

    await page.goto("/youtube-tools/youtube-hashtag-checker");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Hashtag Checker");
    await expect(page.getByText(/paste text to extract hashtags/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy hashtags" })).toHaveCount(0);

    const textarea = page.getByLabel("Paste title, description, or hashtag text");
    await textarea.fill("plain text without hashtags");
    await expect(page.getByText(/no hashtags found/i)).toBeVisible();

    await textarea.fill("#One #Two #One");
    const copyButton = page.getByRole("button", { name: "Copy hashtags" });
    await expect(copyButton).toBeEnabled();
    await expect(page.getByText("3", { exact: true }).first()).toBeVisible();

    await copyButton.click();
    await expect(page.getByRole("status")).toContainText(/copied/i);
    if (browserName === "chromium") {
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText().then((text) => text.replace(/\r\n/g, "\n"))))
        .toBe("#One\n#Two\n#One");
    }

    await page.getByRole("button", { name: "Remove duplicate hashtags" }).click();
    await expect(textarea).toHaveValue("#One #Two ");
    await page.getByRole("button", { name: "Remove duplicate hashtags" }).click();
    await expect(page.getByText(/nothing to change/i)).toBeVisible();

    await textarea.fill(makeTags(60));
    await expect(copyButton).toBeEnabled();

    await textarea.fill(makeTags(61));
    await expect(copyButton).toBeDisabled();
    await expect(page.getByText(/copy is disabled until the list is back at 60 or fewer/i)).toBeVisible();

    await textarea.fill(makeTags(60));
    await expect(copyButton).toBeEnabled();
  });

  test("loads example, clears, has no console/runtime errors, and no horizontal overflow at 390px", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/youtube-tools/youtube-hashtag-checker");

    await page.getByRole("button", { name: "Load example" }).click();
    await expect(page.getByLabel("Paste title, description, or hashtag text")).toHaveValue(/Example only/);
    await expect(page.getByText("1", { exact: true }).last()).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText(/paste text to extract hashtags/i)).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    expect(errors).toEqual([]);
  });

  test("is live and indexable with 200, canonical, and sitemap inclusion", async ({ page, request }) => {
    const response = await page.goto("/youtube-tools/youtube-hashtag-checker");
    expect(response?.status()).toBe(200);

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://creatortoolworks.com/youtube-tools/youtube-hashtag-checker",
    );

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const body = await sitemap.text();
    expect(body).toContain("youtube-hashtag-checker");
    for (const liveSlug of [
      "thumbnail-size-checker",
      "youtube-timestamp-generator",
      "youtube-description-formatter",
      "youtube-chapter-generator",
      "youtube-earnings-estimator",
      "youtube-title-checker",
    ]) {
      expect(body).toContain(liveSlug);
    }
  });

  test("captures requested owner-review screenshots", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-hashtag-checker");
    await waitForHydrationBeforeScreenshot(page);
    await page.screenshot({ path: "screenshots/tool7-01-empty-no-hashtag-state.png", fullPage: true });

    const textarea = page.getByLabel("Paste title, description, or hashtag text");
    await textarea.fill("#CreatorTools #YouTubeTips #CreatorTools\nDescription #Shorts");
    await textarea.blur();
    await page.screenshot({ path: "screenshots/tool7-02-normal-valid-hashtag-list.png", fullPage: true });

    await textarea.fill(makeTags(60));
    await textarea.blur();
    await page.screenshot({ path: "screenshots/tool7-03-exactly-60-hashtags.png", fullPage: true });

    await textarea.fill(makeTags(61));
    await textarea.blur();
    await page.screenshot({ path: "screenshots/tool7-04-61-hashtag-error.png", fullPage: true });

    await textarea.fill("#B #A #B #A #a");
    await page.getByRole("button", { name: "Remove duplicate hashtags" }).click();
    await textarea.blur();
    await page.screenshot({ path: "screenshots/tool7-05-duplicate-cleanup-result.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await waitForHydrationBeforeScreenshot(page);
    await page.screenshot({ path: "screenshots/tool7-06-390px-mobile.png", fullPage: true });
  });

  test("Tools #1-#6 remain live and indexable", async ({ page, request }) => {
    const liveSlugs = [
      "thumbnail-size-checker",
      "youtube-timestamp-generator",
      "youtube-description-formatter",
      "youtube-chapter-generator",
      "youtube-earnings-estimator",
      "youtube-title-checker",
    ];

    const sitemap = await (await request.get("/sitemap.xml")).text();

    for (const slug of liveSlugs) {
      const response = await page.goto(`/youtube-tools/${slug}`);
      expect(response?.status(), slug).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://creatortoolworks.com/youtube-tools/${slug}`,
      );
      expect(sitemap).toContain(slug);
    }
  });
});
