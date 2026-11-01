import { test, expect } from "@playwright/test";

test.describe("homepage", () => {
  test("renders hero and GO button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Test Your Internet/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Speed Test", exact: true })).toBeVisible();
    await expect(page.getByText("MySpeedGauge").first()).toBeVisible();
  });

  test("seo tool pages load", async ({ page }) => {
    for (const path of [
      "/internet-speed-test",
      "/wifi-speed-test",
      "/guides/what-is-good-internet-speed",
      "/tools/mbps-to-mbs",
    ]) {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
