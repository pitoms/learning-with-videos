import { test, expect } from "@playwright/test";

test.describe("Video Playback", () => {
  test("can navigate to video and player loads", async ({ page }) => {
    await page.goto("/");

    // Wait for videos to load
    await expect(page.locator("a[href^='/video/']").first()).toBeVisible();

    // Click the first video card
    await page.locator("a[href^='/video/']").first().click();

    // Should navigate to video page
    await expect(page).toHaveURL(/\/video\/.+/);

    // Video player container should be visible
    await expect(
      page
        .locator("video, [data-testid='video-player'], iframe[src*='youtube']")
        .first()
    ).toBeVisible({ timeout: 10000 });

    // Back button should be visible
    const backButton = page.getByRole("button", { name: /back to videos/i });
    await expect(backButton).toBeVisible();
  });

  test("can navigate back to home from video page", async ({ page }) => {
    await page.goto("/");

    // Navigate to a video
    await page.locator("a[href^='/video/']").first().click();
    await expect(page).toHaveURL(/\/video\/.+/);

    // Click back button
    const backButton = page.getByRole("button", { name: /back to videos/i });
    await backButton.click();

    // Should be back on home page
    await expect(page).toHaveURL("/");
  });
});
