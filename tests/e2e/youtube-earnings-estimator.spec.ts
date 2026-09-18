import { expect, test } from "@playwright/test";

test.describe("YouTube Earnings Estimator", () => {
  test("calculates, validates, copies, and clears an estimate", async ({ page, context, browserName }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }

    await page.goto("/youtube-tools/youtube-earnings-estimator");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("YouTube Earnings Estimator");
    await expect(page.getByText(/incomplete fields are neutral/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy estimate" })).toHaveCount(0);

    await page.getByLabel("Views / engaged views").fill("100000");
    await page.getByLabel("Low RPM").fill("1.00");
    await page.getByLabel("High RPM").fill("2.00");
    await expect(page.locator("p").filter({ hasText: /^100\.00 to 200\.00$/ }).first()).toBeVisible();

    await page.getByRole("button", { name: "Copy estimate" }).click();
    await expect(page.getByRole("status")).toContainText(/copied/i);
    if (browserName === "chromium") {
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText().then((text) => text.replace(/\r\n/g, "\n")))).toBe(
        [
          "YouTube Earnings Estimator",
          "Views/engaged views: 100,000",
          "Low RPM: 1.00",
          "High RPM: 2.00",
          "Formula: views / 1,000 x RPM",
          "Estimated revenue range: 100.00 to 200.00",
          "Currency: same currency as the RPM values entered; no conversion.",
          "Estimate only, not guaranteed earnings.",
        ].join("\n"),
      );
    }

    await page.getByLabel("High RPM").fill("0.50");
    await expect(page.locator("#earnings-high-rpm-error")).toContainText(/high rpm must be greater than or equal/i);
    await expect(page.getByRole("button", { name: "Copy estimate" })).toHaveCount(0);

    await page.getByRole("button", { name: "Load example" }).click();
    await expect(page.getByLabel("Views / engaged views")).toHaveValue("100000");
    await expect(page.getByText(/not average, typical, recommended, or official/i)).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByLabel("Views / engaged views")).toHaveValue("");
    await expect(page.getByText(/incomplete fields are neutral/i)).toBeVisible();
  });

  test("has no horizontal overflow at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/youtube-tools/youtube-earnings-estimator");
    await page.getByLabel("Views / engaged views").fill("100000");
    await page.getByLabel("Low RPM").fill("1.00");
    await page.getByLabel("High RPM").fill("2.00");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("is live and indexable with correct canonical, catalog visibility, and sitemap inclusion", async ({
    page,
    request,
  }) => {
    const response = await page.goto("/youtube-tools/youtube-earnings-estimator");
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://creatortoolworks.com/youtube-tools/youtube-earnings-estimator",
    );

    await page.goto("/youtube-tools");
    await expect(page.getByRole("link", { name: "YouTube Earnings Estimator" })).toBeVisible();

    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.status()).toBe(200);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain("youtube-earnings-estimator");

    for (const liveTool of [
      "thumbnail-size-checker",
      "youtube-timestamp-generator",
      "youtube-description-formatter",
      "youtube-chapter-generator",
      "youtube-title-checker",
    ]) {
      expect(sitemap).toContain(liveTool);
    }
  });

  test("existing public tool routes remain healthy", async ({ page }) => {
    for (const route of [
      "/",
      "/youtube-tools",
      "/youtube-tools/thumbnail-size-checker",
      "/youtube-tools/youtube-timestamp-generator",
      "/youtube-tools/youtube-description-formatter",
      "/youtube-tools/youtube-chapter-generator",
      "/youtube-tools/youtube-title-checker",
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
    }
  });
});
