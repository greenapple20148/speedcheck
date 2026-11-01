import { expect, test, type Page } from "@playwright/test";

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

const routes = ["/", "/speed-test", "/ping-test", "/download-time-calculator", "/guides", "/mesh-wifi", "/about"];

test.describe("redesign overflow", () => {
  for (const width of [375, 768, 1440]) {
    for (const route of routes) {
      test(`${route} has no horizontal overflow at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(route);
        expect(response?.ok()).toBeTruthy();
        await expect(page.locator("h1, h2").first()).toBeVisible();
        expect(await overflow(page)).toBeLessThanOrEqual(1);
      });
    }
  }
});
