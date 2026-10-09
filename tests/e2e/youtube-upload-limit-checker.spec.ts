import { expect, type Page, test } from "@playwright/test";
import path from "node:path";

const fixturePath = path.join(process.cwd(), "tests/e2e/fixtures/tiny-local-video-fixture.mp4");
const unreadableFixturePath = path.join(process.cwd(), "tests/e2e/fixtures/unreadable-video-fixture.mp4");

async function fillManualMetadata(page: Page, sizeGb: string, durationSeconds: string) {
  await page.getByLabel("File size in GB").fill(sizeGb);
  await page.getByLabel("Duration seconds").fill(durationSeconds);
}

async function waitForHydrationBeforeScreenshot(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Upload Limit Checker");
  await expect(page.getByLabel(/choose or replace video/i)).toBeVisible();
  await page.waitForTimeout(500);
}

test.describe("YouTube Upload Limit Checker", () => {
  test("handles neutral, ready, thresholds, over-limit errors, example, and clear states", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-upload-limit-checker");
    await expect(page.getByText(/choose a video file to check its local file size/i)).toBeVisible();

    await fillManualMetadata(page, "0.825", "899");
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();
    await expect(page.getByText("825 MB")).toBeVisible();
    await expect(page.getByText("14:59")).toBeVisible();
    await expect(page.getByText(/does not exceed YouTube's default 15-minute/i)).toBeVisible();

    await fillManualMetadata(page, "256", "43200");
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();
    await expect(page.locator("dl").getByText("256 GB", { exact: true })).toBeVisible();
    await expect(page.locator("dl").getByText("12:00:00", { exact: true })).toBeVisible();

    await fillManualMetadata(page, "256.001", "60");
    await expect(page.getByText(/upload limit issue/i)).toBeVisible();
    await expect(page.getByText(/larger than YouTube's published 256 GB/i)).toBeVisible();

    await fillManualMetadata(page, "1", "43200.001");
    await expect(page.getByText(/upload limit issue/i)).toBeVisible();
    await expect(page.getByText(/longer than YouTube's published 12-hour/i)).toBeVisible();
    await expect(page.getByText("12:00:00.001")).toBeVisible();

    await fillManualMetadata(page, "0", "60");
    await expect(page.getByText("File size must be greater than zero.", { exact: true })).toBeVisible();
    await fillManualMetadata(page, "-1", "60");
    await expect(page.getByText("File size must be greater than zero.", { exact: true })).toBeVisible();
    await fillManualMetadata(page, "1", "0");
    await expect(page.getByText("Duration must be greater than zero seconds.", { exact: true })).toBeVisible();
    await fillManualMetadata(page, "1", "-1");
    await expect(page.getByText("Duration must be greater than zero seconds.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /load example metadata/i }).click();
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();
    await expect(page.getByText("24:00")).toBeVisible();
    await expect(page.getByText(/Account verification required for longer uploads/i)).toBeVisible();
    await expect(page.getByText(/illustrative only/i)).toBeVisible();

    await page.getByRole("button", { name: /^Clear$/ }).click();
    await expect(page.getByText(/choose a video file to check its local file size/i)).toBeVisible();
  });

  test("reads real playable video metadata and causes no upload request", async ({ page }) => {
    const externalRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith("http://127.0.0.1") && !url.startsWith("http://localhost") && !url.startsWith("blob:")) {
        externalRequests.push(url);
      }
    });

    await page.goto("/youtube-tools/youtube-upload-limit-checker");
    await page.getByLabel(/choose or replace video/i).setInputFiles(fixturePath);
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();
    await expect(page.getByText("0:02")).toBeVisible();
    await expect(page.getByText("video/mp4", { exact: true })).toBeVisible();
    expect(externalRequests).toEqual([]);
  });

  test("keeps unreadable-file manual fallback and revokes object URLs when replacing and clearing", async ({ page }) => {
    await page.addInitScript(() => {
      const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);
      (window as Window & { __revokedObjectUrls?: string[] }).__revokedObjectUrls = [];
      URL.revokeObjectURL = (url: string) => {
        (window as unknown as { __revokedObjectUrls: string[] }).__revokedObjectUrls.push(url);
        originalRevokeObjectURL(url);
      };
    });

    await page.goto("/youtube-tools/youtube-upload-limit-checker");
    const input = page.getByLabel(/choose or replace video/i);

    await input.setInputFiles(fixturePath);
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();

    await input.setInputFiles(fixturePath);
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { __revokedObjectUrls?: string[] }).__revokedObjectUrls?.length ?? 0),
      )
      .toBeGreaterThanOrEqual(1);

    await page.getByRole("button", { name: /^Clear$/ }).click();
    await expect(page.getByText(/choose a video file to check its local file size/i)).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { __revokedObjectUrls?: string[] }).__revokedObjectUrls?.length ?? 0),
      )
      .toBeGreaterThanOrEqual(2);

    await input.setInputFiles(unreadableFixturePath);
    await expect(page.getByText(/Browser metadata could not be read for this file/i)).toBeVisible();
    await fillManualMetadata(page, "2.5", "1440");
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();
  });

  test("is live and indexable with 200, canonical, sitemap inclusion, and catalog visibility", async ({
    page,
    request,
  }) => {
    const response = await page.goto("/youtube-tools/youtube-upload-limit-checker");
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/YouTube Upload Limit Checker/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /Check local video size and duration against YouTube's published upload limits/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://creatortoolworks.com/youtube-tools/youtube-upload-limit-checker",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    await page.goto("/youtube-tools");
    await expect(page.getByRole("link", { name: /YouTube Upload Limit Checker/i })).toBeVisible();

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("youtube-upload-limit-checker");
  });

  test("has no console/runtime errors and no horizontal overflow at 390px", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/youtube-tools/youtube-upload-limit-checker");
    await fillManualMetadata(page, "2.5", "1440");
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    expect(errors).toEqual([]);
  });

  test("captures requested owner-review screenshots", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-upload-limit-checker");
    await waitForHydrationBeforeScreenshot(page);
    await page.screenshot({ path: "screenshots/tool9-01-empty-state.png", fullPage: true });

    await page.getByLabel(/choose or replace video/i).setInputFiles(fixturePath);
    await expect(page.getByText(/within published upload limits/i)).toBeVisible();
    await page.screenshot({ path: "screenshots/tool9-02-valid-local-video.png", fullPage: true });

    await fillManualMetadata(page, "2.5", "1440");
    await expect(page.getByText(/Account verification required for longer uploads/i)).toBeVisible();
    await page.screenshot({ path: "screenshots/tool9-03-over-15-minute-info.png", fullPage: true });

    await fillManualMetadata(page, "256.001", "60");
    await expect(page.getByText(/upload limit issue/i)).toBeVisible();
    await page.screenshot({ path: "screenshots/tool9-04-over-256gb-error.png", fullPage: true });

    await fillManualMetadata(page, "1", "43201");
    await expect(page.getByText(/upload limit issue/i)).toBeVisible();
    await page.screenshot({ path: "screenshots/tool9-05-over-12-hour-error.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await waitForHydrationBeforeScreenshot(page);
    await fillManualMetadata(page, "2.5", "1440");
    await page.screenshot({ path: "screenshots/tool9-06-390px-mobile.png", fullPage: true });
  });

  test("Tools #1-#8 remain live and indexable", async ({ page, request }) => {
    const liveSlugs = [
      "thumbnail-size-checker",
      "youtube-timestamp-generator",
      "youtube-description-formatter",
      "youtube-chapter-generator",
      "youtube-earnings-estimator",
      "youtube-title-checker",
      "youtube-hashtag-checker",
      "youtube-shorts-format-checker",
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
