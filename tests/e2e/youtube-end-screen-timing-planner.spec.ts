import { expect, type Page, test } from "@playwright/test";

async function fillTiming(page: Page, duration: string, length: string) {
  await page.getByLabel("Video duration").fill(duration);
  await page.getByLabel(/End screen length/).fill(length);
}

async function waitForHydrationBeforeScreenshot(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube End Screen Timing Planner");
  await expect(page.getByLabel("Video duration")).toBeVisible();
  // Confirm the client handlers are active, then restore the neutral capture state.
  await page.getByRole("button", { name: /load example/i }).click();
  await expectMetricValue(page, "End screen starts", "12:20");
  await page.getByRole("button", { name: /^Clear$/ }).click();
  await expect(page.getByText(/enter a video duration and end screen length/i)).toBeVisible();
}

async function expectMetricValue(page: Page, label: string, value: string) {
  const metric = page.locator("dl > div").filter({ has: page.locator("dt", { hasText: label }) });
  await expect(metric.locator("dd")).toHaveText(value);
}

test.describe("YouTube End Screen Timing Planner", () => {
  test("handles neutral, ready, boundaries, errors, example, clear, and copy", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/youtube-tools/youtube-end-screen-timing-planner");
    await expect(page.getByText(/enter a video duration and end screen length/i)).toBeVisible();

    await fillTiming(page, "24", "5");
    await expect(page.getByText("Video is too short for an end screen")).toBeVisible();

    await fillTiming(page, "25", "5");
    await expect(page.getByText("End screen timing ready")).toBeVisible();
    await expectMetricValue(page, "End screen starts", "00:20");
    await expectMetricValue(page, "End screen ends", "00:25");

    await fillTiming(page, "25", "20");
    await expectMetricValue(page, "End screen starts", "00:05");
    await expectMetricValue(page, "End screen length", "20 seconds");

    await fillTiming(page, "12:35", "15");
    await expectMetricValue(page, "End screen starts", "12:20");
    await expectMetricValue(page, "End screen ends", "12:35");

    await fillTiming(page, "1:02:15", "20");
    await expectMetricValue(page, "End screen starts", "1:01:55");
    await expectMetricValue(page, "End screen ends", "1:02:15");

    await fillTiming(page, "30", "4");
    await expect(page.getByText(/at least 5 seconds/i)).toBeVisible();
    await fillTiming(page, "30", "21");
    await expect(page.getByText(/no more than 20 seconds/i)).toBeVisible();
    await fillTiming(page, "invalid", "5");
    await expect(page.getByText(/valid timestamp/i)).toBeVisible();
    await fillTiming(page, "0", "5");
    await expect(page.getByText(/greater than zero/i)).toBeVisible();
    await fillTiming(page, "-1", "5");
    await expect(page.getByText(/valid timestamp/i)).toBeVisible();

    await page.getByRole("button", { name: /load example/i }).click();
    await expectMetricValue(page, "End screen starts", "12:20");
    await expect(page.getByText(/not a recommendation, performance claim, or optimization target/i)).toBeVisible();

    await page.getByRole("button", { name: /copy timing/i }).click();
    await expect(page.getByText(/copied to your clipboard/i)).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText().then((text) => text.replace(/\r\n/g, "\n"))))
      .toBe(
        [
          "YouTube end screen timing",
          "Video duration: 12:35",
          "Start: 12:20",
          "End: 12:35",
          "End screen length: 15 seconds",
        ].join("\n"),
      );

    await page.getByRole("button", { name: /^Clear$/ }).click();
    await expect(page.getByText(/enter a video duration and end screen length/i)).toBeVisible();
  });

  test("keeps timing guidance informational and avoids unsupported performance claims", async ({ page }) => {
    await page.goto("/youtube-tools/youtube-end-screen-timing-planner");

    await expect(page.getByText(/standard 16:9 videos can have up to/i)).toBeVisible();
    await expect(page.getByText(/informational guidance, not a timing pass\/fail rule/i)).toBeVisible();
    await expect(page.getByText(/timing compliance does not guarantee/i)).toBeVisible();
    await expect(page.getByText(/does not predict views, retention, click-through rate, or performance/i)).toBeVisible();
    await expect(page.getByText(/optimal/i)).toHaveCount(0);
    await expect(page.getByText(/better retention/i)).toHaveCount(0);
    await expect(page.getByText(/improve CTR/i)).toHaveCount(0);
  });

  test("is live, 200, self-canonical, indexable, present in sitemap, and catalog-visible", async ({
    page,
    request,
  }) => {
    const response = await page.goto("/youtube-tools/youtube-end-screen-timing-planner");
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/YouTube End Screen Timing Planner/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /Calculate when a YouTube end screen should start/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://creatortoolworks.com/youtube-tools/youtube-end-screen-timing-planner",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    await page.goto("/youtube-tools");
    await expect(page.getByRole("link", { name: /YouTube End Screen Timing Planner/i })).toBeVisible();

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("youtube-end-screen-timing-planner");
  });

  test("has no console/runtime errors and no horizontal overflow at 390px", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/youtube-tools/youtube-end-screen-timing-planner");
    await fillTiming(page, "12:35", "15");
    await expect(page.getByText("End screen timing ready")).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    expect(errors).toEqual([]);
  });

  test("captures requested owner-review screenshots", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Owner-review screenshots are captured once at deterministic sizes in Chromium. Mobile behavior is covered by dedicated functional/responsive tests.",
    );
    await page.goto("/youtube-tools/youtube-end-screen-timing-planner");
    await waitForHydrationBeforeScreenshot(page);
    await page.screenshot({ path: "screenshots/tool10-01-empty-state.png", fullPage: true });

    await fillTiming(page, "12:35", "15");
    await expect(page.getByText("End screen timing ready")).toBeVisible();
    await page.screenshot({ path: "screenshots/tool10-02-ready-timing.png", fullPage: true });

    await fillTiming(page, "25", "5");
    await expectMetricValue(page, "End screen starts", "00:20");
    await page.screenshot({ path: "screenshots/tool10-03-25-second-boundary.png", fullPage: true });

    await fillTiming(page, "24", "5");
    await expect(page.getByText("Video is too short for an end screen")).toBeVisible();
    await page.screenshot({ path: "screenshots/tool10-04-under-25-error.png", fullPage: true });

    await fillTiming(page, "30", "21");
    await expect(page.getByText(/no more than 20 seconds/i)).toBeVisible();
    await page.screenshot({ path: "screenshots/tool10-05-invalid-window-error.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await waitForHydrationBeforeScreenshot(page);
    await fillTiming(page, "12:35", "15");
    await expect(page.getByText("End screen timing ready")).toBeVisible();
    await page.screenshot({ path: "screenshots/tool10-06-390px-mobile.png", fullPage: true });
  });

  test("Tools #1-#9 remain live and indexable", async ({ page, request }) => {
    const liveSlugs = [
      "thumbnail-size-checker",
      "youtube-timestamp-generator",
      "youtube-description-formatter",
      "youtube-chapter-generator",
      "youtube-earnings-estimator",
      "youtube-title-checker",
      "youtube-hashtag-checker",
      "youtube-shorts-format-checker",
      "youtube-upload-limit-checker",
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
