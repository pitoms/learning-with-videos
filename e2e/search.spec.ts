import { test, expect } from "@playwright/test";

test.describe("Search and Filter", () => {
  test("can search videos by title", async ({ page }) => {
    await page.goto("/");

    // Wait for videos to load
    await expect(page.locator("a[href^='/video/']").first()).toBeVisible();

    // Get initial video count
    const initialCount = await page.locator("a[href^='/video/']").count();
    expect(initialCount).toBeGreaterThan(0);

    // Get the title of the first video for searching
    const firstVideoTitle = await page
      .locator("a[href^='/video/'] h3")
      .first()
      .textContent();

    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Search for partial title (first word)
    const searchTerm = firstVideoTitle?.split(" ")[0] || "";
    await searchInput.fill(searchTerm);

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Should still have at least the matching video
    const filteredCount = await page.locator("a[href^='/video/']").count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("shows all videos when search is cleared", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("a[href^='/video/']").first()).toBeVisible();
    const initialCount = await page.locator("a[href^='/video/']").count();

    const searchInput = page.getByPlaceholder(/search/i);

    // Search for something
    await searchInput.fill("test search query");
    await page.waitForTimeout(300);

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);

    // Should show all videos again
    const countAfterClear = await page.locator("a[href^='/video/']").count();
    expect(countAfterClear).toBe(initialCount);
  });

  test("shows correct count when filtering", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("a[href^='/video/']").first()).toBeVisible();

    // Look for the video count display
    const countDisplay = page.getByText(/\d+ videos?/i);

    // Get initial count text
    const initialCountText = await countDisplay.textContent();

    // Search for something specific
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("xyznonexistent");
    await page.waitForTimeout(300);

    // Count should update (likely to 0)
    const filteredCountText = await countDisplay.textContent();

    // The count should have changed
    expect(filteredCountText).not.toBe(initialCountText);
  });
});
