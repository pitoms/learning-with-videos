import { test, expect } from "@playwright/test";

test.describe("Video Notes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("can add a note on video page", async ({ page }) => {
    await page.goto("/");

    // Navigate to first video
    await page.locator("a[href^='/video/']").first().click();
    await expect(page).toHaveURL(/\/video\/.+/);

    // Find the notes input - look for placeholder text or input in sidebar
    const noteInput = page
      .getByPlaceholder(/add.*note|note/i)
      .or(
        page
          .locator("textarea, input[type='text']")
          .filter({ hasText: "" })
          .first()
      );

    // If there's a dedicated notes section, find it
    const notesSection = page.getByText(/notes/i).first();
    if (await notesSection.isVisible()) {
      await notesSection.click();
    }

    // Type a note
    const testNote = "This is a test note at this timestamp";
    await noteInput.first().fill(testNote);

    // Submit the note (Enter or button click)
    await noteInput.first().press("Enter");

    // Note should appear in the list
    await expect(page.getByText(testNote)).toBeVisible();
  });

  test("notes persist after page refresh", async ({ page }) => {
    await page.goto("/");

    const videoLink = page.locator("a[href^='/video/']").first();
    const videoHref = await videoLink.getAttribute("href");
    const videoId = videoHref?.replace("/video/", "");

    // Pre-populate a note via localStorage
    const testNote = "Persisted test note";
    await page.evaluate(
      ({ id, note }) => {
        const notes = {
          [id!]: [
            {
              id: "test-note-1",
              videoId: id,
              content: note,
              timestamp: 15,
              estimatedDuration: 30,
              createdAt: new Date().toISOString(),
            },
          ],
        };
        localStorage.setItem("video_notes", JSON.stringify(notes));
      },
      { id: videoId, note: testNote }
    );

    // Navigate to the video
    await videoLink.click();
    await expect(page).toHaveURL(/\/video\/.+/);

    // Note should be visible
    await expect(page.getByText(testNote)).toBeVisible();
  });

  test("can delete a note", async ({ page }) => {
    await page.goto("/");

    const videoLink = page.locator("a[href^='/video/']").first();
    const videoHref = await videoLink.getAttribute("href");
    const videoId = videoHref?.replace("/video/", "");

    // Pre-populate a note
    const testNote = "Note to be deleted";
    await page.evaluate(
      ({ id, note }) => {
        const notes = {
          [id!]: [
            {
              id: "delete-test-note",
              videoId: id,
              content: note,
              timestamp: 10,
              estimatedDuration: 30,
              createdAt: new Date().toISOString(),
            },
          ],
        };
        localStorage.setItem("video_notes", JSON.stringify(notes));
      },
      { id: videoId, note: testNote }
    );

    await videoLink.click();
    await expect(page).toHaveURL(/\/video\/.+/);

    // Note should be visible
    await expect(page.getByText(testNote)).toBeVisible();

    // Find and click delete button (usually an X or trash icon near the note)
    const noteElement = page.getByText(testNote);
    const deleteButton = noteElement
      .locator("..")
      .locator("button")
      .filter({ has: page.locator("svg") })
      .first();

    await deleteButton.click();

    // Note should be gone
    await expect(page.getByText(testNote)).not.toBeVisible();
  });
});
