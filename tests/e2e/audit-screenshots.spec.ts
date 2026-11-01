import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/speed-test",
  "/bufferbloat-test",
  "/packet-loss-test",
  "/connection-stability-test",
  "/gaming-speed-test",
  "/streaming-speed-test",
  "/video-call-test",
  "/dns-speed-test",
  "/ping-test",
  "/jitter-test",
  "/internet-troubleshooter",
  "/download-time-calculator",
  "/upload-time-calculator",
  "/mbps-to-mbs",
  "/internet-speed-calculator",
  "/methodology",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test.describe("production audit screenshots", () => {
  test.describe.configure({ mode: "serial" });

  for (const viewport of VIEWPORTS) {
    for (const path of PAGES) {
      test(`${viewport.name} ${path}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(response?.ok()).toBeTruthy();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);

        if (path === "/" || path === "/speed-test") {
          await expect(page.getByRole("button", { name: /start speed test/i })).toBeInViewport();
        }

        const slug = path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "-");
        await page.screenshot({
          path: `test-results/audit-screenshots/${viewport.name}-${slug}.png`,
          fullPage: true,
        });
      });
    }
  }

  test("tools menu reaches the bufferbloat test", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Tools", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Bufferbloat test", exact: true })
      .click();
    await expect(page).toHaveURL(/bufferbloat-test/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
