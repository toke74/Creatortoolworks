import path from "node:path";
import { expect, test } from "@playwright/test";

const fixturePath = path.join(__dirname, "fixtures", "sample-thumbnail.png");

test.describe("Thumbnail Size Checker", () => {
  test("analyzes an uploaded thumbnail and supports reset", async ({ page }) => {
    await page.goto("/youtube-tools/thumbnail-size-checker");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thumbnail Size Checker");

    const fileInput = page.getByLabel(/drop an image here or choose a file/i);
    await fileInput.setInputFiles(fixturePath);

    await expect(page.getByText("320 × 180px")).toBeVisible();
    await expect(page.getByText(/aspect ratio/i).first()).toBeVisible();
    await expect(page.getByText(/file size/i).first()).toBeVisible();

    const resetButton = page.getByRole("button", { name: /check another thumbnail/i });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    await expect(page.getByText(/select an image to see/i)).toBeVisible();
  });
});
