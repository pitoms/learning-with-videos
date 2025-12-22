import { test, expect } from "@playwright/test";

test.describe("Video Progress Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("saves and displays progress on video card", async ({ page }) => {
    await page.goto("/");

    // Get the first video link
    const videoLink = page.locator("a[href^='/video/']").first();
    const videoHref = await videoLink.getAttribute("href");
    await videoLink.click();

    // Wait for video page to load
    await expect(page).toHaveURL(/\/video\/.+/);

    // Simulate progress by setting localStorage directly
    // Extract video ID from URL
    const videoId = videoHref?.replace("/video/", "");

    await page.evaluate((id) => {
      const progress = {
        [id!]: {
          currentTime: 30,
          duration: 100,
          lastWatched: Date.now(),
          completed: false,
        },
      };
      localStorage.setItem("video_progress", JSON.stringify(progress));
    }, videoId);

    // Go back to home
    await page.goto("/");

    // The video card should show progress indicator
    // Look for the progress bar or "watched" text
    const videoCard = page.locator(`a[href='${videoHref}']`);
    await expect(videoCard).toBeVisible();

    // Check for progress indicator (either progress bar or percentage text)
    const hasProgressBar =
      (await videoCard.locator(".bg-linear-to-r, [class*='primary']").count()) >
      0;
    const hasWatchedText =
      (await videoCard.getByText(/\d+% watched/).count()) > 0;

    expect(hasProgressBar || hasWatchedText).toBeTruthy();
  });

  test("shows completed badge when video is fully watched", async ({
    page,
  }) => {
    await page.goto("/");

    const videoLink = page.locator("a[href^='/video/']").first();
    const videoHref = await videoLink.getAttribute("href");
    const videoId = videoHref?.replace("/video/", "");

    // Set completed progress in localStorage
    await page.evaluate((id) => {
      const progress = {
        [id!]: {
          currentTime: 95,
          duration: 100,
          lastWatched: Date.now(),
          completed: true,
        },
      };
      localStorage.setItem("video_progress", JSON.stringify(progress));
    }, videoId);

    // Reload to see the badge
    await page.reload();

    const videoCard = page.locator(`a[href='${videoHref}']`);
    await expect(videoCard.getByText("Completed")).toBeVisible();
  });
});
