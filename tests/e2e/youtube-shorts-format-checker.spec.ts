import { expect, type Page, test } from "@playwright/test";
import path from "node:path";

const fixturePath = path.join(process.cwd(), "tests/e2e/fixtures/tiny-local-video-fixture.mp4");
const unreadableFixturePath = path.join(process.cwd(), "tests/e2e/fixtures/unreadable-video-fixture.mp4");

async function fillManualMetadata(page: Page, width: string, height: string, duration: string) {
  await page.getByLabel("Width").fill(width);
  await page.getByLabel("Height").fill(height);
  await page.getByLabel("Duration seconds").fill(duration);
}

async function waitForHydrationBeforeScreenshot(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Shorts Format Checker");
  await expect(page.getByLabel(/choose or replace video/i)).toBeVisible();
  await page.waitForTimeout(500);
}

test.describe("YouTube Shorts Format Checker", () => {
  test("handles neutral, ready, square, horizontal error, over-3-minute error, clear, and example states", async ({
    page,
  }) => {
    await page.goto("/youtube-tools/youtube-shorts-format-checker");
    await expect(page.getByText(/choose a video file to check duration/i)).toBeVisible();

    await fillManualMetadata(page, "1080", "1920", "59");
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();
    await expect(page.getByText("Vertical", { exact: true })).toBeVisible();
    await expect(page.getByText("0:59")).toBeVisible();

    await fillManualMetadata(page, "1080", "1920", "180");
    await expect(page.getByText("3:00", { exact: true })).toBeVisible();
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();

    await fillManualMetadata(page, "1080", "1080", "120");
    await expect(page.getByText("Square", { exact: true })).toBeVisible();
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();

    await fillManualMetadata(page, "1920", "1080", "120");
    await expect(page.getByText(/shorts format issue/i)).toBeVisible();
    await expect(page.getByText("Horizontal", { exact: true })).toBeVisible();

    await fillManualMetadata(page, "1080", "1920", "180.001");
    await expect(page.getByText(/shorts format issue/i)).toBeVisible();
    await expect(page.getByText("3:00.001")).toBeVisible();

    await fillManualMetadata(page, "0", "1920", "10");
    await expect(page.getByText(/width and height must both be greater than zero/i)).toBeVisible();

    await page.getByRole("button", { name: /load example metadata/i }).click();
    await expect(page.getByText(/illustrative only/i)).toBeVisible();
    await expect(page.getByText("2:30")).toBeVisible();

    await page.getByRole("button", { name: /^Clear$/ }).click();
    await expect(page.getByText(/choose a video file to check duration/i)).toBeVisible();
  });

  test("reads real playable video metadata and causes no upload request", async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith("http://127.0.0.1") && !url.startsWith("http://localhost") && !url.startsWith("blob:")) {
        externalRequests.push(url);
      }
    });

    await page.goto("/youtube-tools/youtube-shorts-format-checker");
    await page.getByLabel(/choose or replace video/i).setInputFiles(fixturePath);
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();
    await expect(page.getByText("90 x 160px")).toBeVisible();
    await expect(page.getByText("0:02")).toBeVisible();
    await expect(page.getByText("Vertical", { exact: true })).toBeVisible();
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

    await page.goto("/youtube-tools/youtube-shorts-format-checker");
    const input = page.getByLabel(/choose or replace video/i);

    await input.setInputFiles(fixturePath);
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();

    await input.setInputFiles(fixturePath);
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __revokedObjectUrls?: string[] }).__revokedObjectUrls?.length ?? 0))
      .toBeGreaterThanOrEqual(1);

    await page.getByRole("button", { name: /^Clear$/ }).click();
    await expect(page.getByText(/choose a video file to check duration/i)).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __revokedObjectUrls?: string[] }).__revokedObjectUrls?.length ?? 0))
      .toBeGreaterThanOrEqual(2);

    await input.setInputFiles(unreadableFixturePath);
    await expect(page.getByText(/Browser metadata could not be read for this file/i)).toBeVisible();
    await fillManualMetadata(page, "1080", "1920", "150");
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();
  });

  test("is live and indexable with 200, canonical, sitemap inclusion, and catalog visibility", async ({
    page,
    request,
  }) => {
    const response = await page.goto("/youtube-tools/youtube-shorts-format-checker");
    expect(response?.status()).toBe(200);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://creatortoolworks.com/youtube-tools/youtube-shorts-format-checker",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    await page.goto("/youtube-tools");
    await expect(page.getByRole("link", { name: /YouTube Shorts Format Checker/i })).toBeVisible();

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("youtube-shorts-format-checker");
  });

  test("has no console/runtime errors and no horizontal overflow at 390px", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/youtube-tools/youtube-shorts-format-checker");
    await fillManualMetadata(page, "1080", "1920", "150");
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    expect(errors).toEqual([]);
  });

  test("captures requested owner-review screenshots", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-shorts-format-checker");
    await waitForHydrationBeforeScreenshot(page);
    await page.screenshot({ path: "screenshots/tool8-01-empty-state.png", fullPage: true });

    await page.getByLabel(/choose or replace video/i).setInputFiles(fixturePath);
    await expect(page.getByText(/ready for shorts format/i)).toBeVisible();
    await page.screenshot({ path: "screenshots/tool8-02-valid-vertical-video.png", fullPage: true });

    await fillManualMetadata(page, "1080", "1080", "120");
    await page.screenshot({ path: "screenshots/tool8-03-valid-square-video.png", fullPage: true });

    await fillManualMetadata(page, "1920", "1080", "120");
    await page.screenshot({ path: "screenshots/tool8-04-horizontal-error.png", fullPage: true });

    await fillManualMetadata(page, "1080", "1920", "181");
    await page.screenshot({ path: "screenshots/tool8-05-over-3-minute-error.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await waitForHydrationBeforeScreenshot(page);
    await fillManualMetadata(page, "1080", "1920", "150");
    await page.screenshot({ path: "screenshots/tool8-06-390px-mobile.png", fullPage: true });
  });

  test("Tools #1-#7 remain live and indexable", async ({ page, request }) => {
    const liveSlugs = [
      "thumbnail-size-checker",
      "youtube-timestamp-generator",
      "youtube-description-formatter",
      "youtube-chapter-generator",
      "youtube-earnings-estimator",
      "youtube-title-checker",
      "youtube-hashtag-checker",
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
