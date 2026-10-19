import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { exampleTitle, previewLayouts } from "../../src/lib/tools/thumbnail-title-previewer/preview";

const route = "/youtube-tools/youtube-thumbnail-title-previewer";
const fixture = path.join(__dirname, "fixtures", "tool11-abstract-thumbnail.png");
const status = (page: Page) => page.getByTestId("preview-status");

async function example(page: Page) {
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(status(page)).toContainText("Ready");
  await expect.poll(() => page.locator('[data-testid="preview-layouts"] img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
}

test.describe("YouTube Thumbnail & Title Previewer", () => {
  test("neutral state, real local image, all layouts, title boundaries, exact text, and clear", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await expect(status(page)).toContainText("Neutral");
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    await example(page);
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(status(page)).toContainText("Neutral");
    await expect(page.getByLabel("Video title", { exact: true })).toHaveValue("");
    await page.getByLabel("Choose thumbnail", { exact: true }).setInputFiles(fixture);
    await expect(page.getByText(/320 × 180px/)).toBeVisible();
    const images = page.locator('[data-testid="preview-layouts"] img');
    await expect(images).toHaveCount(5);
    for (const layout of previewLayouts) {
      await expect(page.locator(`[data-layout="${layout.id}"] img`)).toBeVisible();
      await expect(page.getByRole("heading", { name: layout.label, exact: true })).toBeVisible();
    }
    expect(await images.evaluateAll((items) => items.every((item) => (item as HTMLImageElement).naturalWidth === 320))).toBe(true);
    const title = "  My exact title 🎬 <b>with spaces</b>  ";
    await page.getByLabel("Video title", { exact: true }).fill(title);
    await expect(status(page)).toContainText("Ready");
    expect(await page.getByTestId("card-title").allTextContents()).toEqual(Array(5).fill(title));
    await page.getByLabel("Video title", { exact: true }).fill("A".repeat(100));
    await expect(status(page)).toContainText("Ready");
    await page.getByLabel("Video title", { exact: true }).fill("A".repeat(101));
    await expect(status(page)).toContainText("Error");
    await expect(page.getByLabel("Video title", { exact: true })).toHaveValue("A".repeat(101));
    expect(await page.getByTestId("card-title").allTextContents()).toEqual(Array(5).fill("A".repeat(101)));
    expect(await page.getByTestId("card-title").evaluateAll((items) => items.every((item) => getComputedStyle(item).overflow === "hidden" && Number(getComputedStyle(item).webkitLineClamp) >= 2))).toBe(true);
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(status(page)).toContainText("Neutral");
    await expect(images).toHaveCount(0);
    await expect(page.getByLabel("Video title", { exact: true })).toHaveValue("");
    expect(errors).toEqual([]);
  });

  test("replaces every image, handles corrupt and non-image files, and accepts a non-16:9 crop", async ({ page }) => {
    await page.goto(route);
    await example(page);
    const firstSrc = await page.locator('[data-layout="mobile"] img').getAttribute("src");
    await page.getByLabel("Replace thumbnail", { exact: true }).setInputFiles(fixture);
    await expect(page.getByText(/320 × 180px/)).toBeVisible();
    const sources = await page.locator('[data-testid="preview-layouts"] img').evaluateAll((items) => items.map((item) => item.getAttribute("src")));
    expect(new Set(sources).size).toBe(1);
    expect(sources[0]).not.toBe(firstSrc);
    await page.getByLabel("Replace thumbnail", { exact: true }).setInputFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("corrupt bytes") });
    await expect(page.locator("main").getByRole("alert")).toContainText("could not be opened");
    await page.getByLabel("Choose thumbnail", { exact: true }).setInputFiles({ name: "not-image.txt", mimeType: "text/plain", buffer: Buffer.from("local text") });
    await expect(page.locator("main").getByRole("alert")).toContainText("Choose a readable image");
    // Repository-owned PNG with modified dimensions generated from the real PNG in-browser.
    // Canvas is used only to create a test fixture, never in the product.
    const square = await page.evaluate(async () => {
      const canvas = document.createElement("canvas"); canvas.width = 120; canvas.height = 120;
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#6d4aff"; ctx.fillRect(0, 0, 120, 120);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    await page.getByLabel("Choose thumbnail", { exact: true }).setInputFiles({ name: "square.png", mimeType: "image/png", buffer: Buffer.from(square, "base64") });
    await expect(page.getByText(/source image is not 16:9/)).toBeVisible();
    await expect(page.locator('[data-testid="preview-layouts"] img')).toHaveCount(5);
  });

  test("keeps image processing local and cleans up object URLs", async ({ page }) => {
    await page.addInitScript(() => {
      const original = URL.revokeObjectURL.bind(URL);
      (window as unknown as { revoked: string[] }).revoked = [];
      URL.revokeObjectURL = (url: string) => {
        (window as unknown as { revoked: string[] }).revoked.push(url); original(url);
      };
    });
    await page.goto(route);
    await expect(page.getByLabel("Choose thumbnail", { exact: true })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const requests: string[] = [];
    page.on("request", (request) => { if (/^https?:/.test(request.url())) requests.push(`${request.method()} ${request.url()}`); });
    await page.getByLabel("Choose thumbnail", { exact: true }).setInputFiles(fixture);
    await expect(page.getByText(/320 × 180px/)).toBeVisible();
    const url = await page.locator('[data-layout="mobile"] img').getAttribute("src");
    await page.getByLabel("Replace thumbnail", { exact: true }).setInputFiles(fixture);
    await expect.poll(() => page.evaluate(() => (window as unknown as { revoked: string[] }).revoked)).toContain(url);
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { revoked: string[] }).revoked.length)).toBe(2);
    expect(requests).toEqual([]);
  });

  test("Light and Dark change simulations only; no claims or runtime errors; keyboard and 390px", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    const input = page.getByLabel("Choose thumbnail", { exact: true });
    await input.focus();
    await expect(input).toBeFocused();
    expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Open Thumbnail Size Checker." })).toBeFocused();
    await example(page);
    const globalAppearance = await page.evaluate(() => [document.documentElement.className, document.documentElement.getAttribute("style"), getComputedStyle(document.body).backgroundColor]);
    const lightColor = await page.locator('[data-layout="mobile"]').evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByLabel("Dark", { exact: true }).check();
    await expect(page.getByTestId("preview-layouts")).toHaveAttribute("data-appearance", "dark");
    expect(await page.locator('[data-layout="mobile"]').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightColor);
    expect(await page.evaluate(() => [document.documentElement.className, document.documentElement.getAttribute("style"), getComputedStyle(document.body).backgroundColor])).toEqual(globalAppearance);
    await page.getByLabel("Light", { exact: true }).check();
    await expect(page.getByTestId("preview-layouts")).toHaveAttribute("data-appearance", "light");
    await page.getByLabel("Video title", { exact: true }).fill("VeryLongUnbrokenTitle".repeat(8));
    await expect(status(page)).toContainText("Error");
    for (const width of [390, 360, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px overflow`).toBeLessThanOrEqual(1);
    }
    const text = await page.locator("main").innerText();
    expect(text).toContain("These are approximate visual previews.");
    expect(text).toContain("This tool cannot determine CTR");
    expect(text).not.toMatch(/guaranteed CTR improvement|best thumbnail|optimized title|pixel-perfect|YouTube shows exactly 2 lines|guarantees? (the |an? )?exact/i);
    expect(errors).toEqual([]);
  });

  test("live SEO and individual Tools #1–#10 live regression", async ({ page, request }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"] ?? "").not.toMatch(/noindex/i);
    await expect(page).toHaveTitle(/YouTube Thumbnail & Title Previewer/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /thumbnail and exact title/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://creatortoolworks.com${route}`);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.status()).toBe(200);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain(`https://creatortoolworks.com${route}</loc>`);
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/^Sitemap: https:\/\/creatortoolworks\.com\/sitemap\.xml\s*$/m);
    await page.goto("/youtube-tools");
    await expect(page.getByRole("link", { name: "YouTube Thumbnail & Title Previewer" })).toBeVisible();
    for (const slug of ["thumbnail-size-checker", "youtube-timestamp-generator", "youtube-description-formatter", "youtube-chapter-generator", "youtube-earnings-estimator", "youtube-title-checker", "youtube-hashtag-checker", "youtube-shorts-format-checker", "youtube-upload-limit-checker", "youtube-end-screen-timing-planner"]) {
      expect((await page.goto(`/youtube-tools/${slug}`))?.status(), slug).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://creatortoolworks.com/youtube-tools/${slug}`);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      expect(sitemap, slug).toContain(`https://creatortoolworks.com/youtube-tools/${slug}</loc>`);
    }
  });

  test("captures six owner-review screenshots", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Capture once at deterministic desktop/mobile sizes.");
    const capture = async (name: string) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `screenshots/${name}`, fullPage: true });
    };
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    await expect(status(page)).toContainText("Neutral");
    await capture("tool11-01-empty-state.png");
    await example(page);
    expect(await page.getByTestId("card-title").allTextContents()).toEqual(Array(5).fill(exampleTitle));
    await capture("tool11-02-desktop-previews.png");
    await page.getByTestId("preview-layouts").screenshot({ path: "screenshots/tool11-03-sidebar-channel-previews.png", style: "header { visibility: hidden !important; }" });
    await page.getByLabel("Dark", { exact: true }).check();
    await capture("tool11-04-dark-preview.png");
    await page.getByLabel("Light", { exact: true }).check();
    await page.getByLabel("Video title", { exact: true }).fill("A weekend studio project: building a little creative space with shelves, lights and room for ideas");
    await capture("tool11-05-long-title-preview.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await capture("tool11-06-390px-mobile.png");
  });
});
