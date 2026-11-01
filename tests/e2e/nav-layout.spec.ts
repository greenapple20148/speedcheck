import { expect, test, type Page } from "@playwright/test";

const widths = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function pageOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe("homepage navigation", () => {
  for (const viewport of widths) {
    test(`${viewport.name} keeps the speed test in view without overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      const start = page.getByRole("button", { name: "Start Speed Test", exact: true });
      await expect(start).toBeVisible();
      await expect(start).toBeInViewport();
      expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: `test-results/nav-redesign/after-${viewport.name}.png`,
        fullPage: false,
      });
    });
  }

  test("desktop items render and the tools menu reaches a real route", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Speed Test", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tools", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Wi-Fi & Mesh", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Network Health", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Guides", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Test History", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Test Speed", exact: true })).toHaveCount(0);

    const tools = page.getByRole("button", { name: "Tools", exact: true });
    await tools.hover();
    const menu = page.getByRole("region", { name: "Tools" });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1440);
    await page.screenshot({ path: "test-results/nav-redesign/after-desktop-menu.png" });
    await menu.getByRole("link", { name: "Download Time", exact: true }).click();
    await expect(page).toHaveURL(/\/download-time-calculator$/);
  });

  test("escape, outside click, and keyboard open and close the tools menu", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const tools = page.getByRole("button", { name: "Tools", exact: true });
    await tools.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("region", { name: "Tools" });
    await expect(menu).toBeVisible();
    await expect(tools).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await tools.click();
    await expect(menu).toBeVisible();
    await page.mouse.click(20, 700);
    await expect(menu).toBeHidden();
  });

  test("network health highlights for a nested diagnostic and links to ping", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/ping-test");
    const health = page.getByRole("button", { name: "Network Health", exact: true });
    await expect(health).toHaveAttribute("data-active", "true");
    await expect(page.getByRole("button", { name: "Tools", exact: true })).not.toHaveAttribute("data-active", "true");
    await health.click();
    const ping = page.getByRole("region", { name: "Network Health" }).getByRole("link", { name: "Ping Test", exact: true });
    await expect(ping).toHaveAttribute("aria-current", "page");
    await ping.click();
    await expect(page).toHaveURL(/\/ping-test$/);
  });

  test("test speed stays off the homepage and does not start a test", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Test Speed", exact: true })).toHaveCount(0);
    await page.goto("/speed-test");
    await expect(page.getByRole("link", { name: "Test Speed", exact: true })).toHaveCount(0);
    await page.goto("/download-time-calculator");
    const cta = page.getByRole("link", { name: "Test Speed", exact: true });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/speed-test$/);
    await expect(page.getByRole("button", { name: "Start Speed Test", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop", exact: true })).toHaveCount(0);
  });

  test("history icon opens the history route", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/guides");
    await page.getByRole("link", { name: "Test History", exact: true }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByRole("link", { name: "Test History", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("tablet drawer groups diagnostics and keeps the speed test linked", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog.getByRole("link", { name: "Speed Test", exact: true })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Test Speed", exact: true })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Network Health" }).click();
    await dialog.getByRole("link", { name: "Connection Stability", exact: true }).click();
    await expect(page).toHaveURL(/\/connection-stability-test$/);
  });

  test("mobile drawer expands a category on a tool page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dns-speed-test");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog.getByRole("link", { name: "Test Speed", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Tools" }).click();
    await expect(dialog.getByRole("link", { name: "DNS Timing", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("no horizontal overflow at 375 and 768", async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "Open menu" }).click();
      expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
      await page.keyboard.press("Escape");
    }
  });

  for (const width of [1024, 1280, 1440]) {
    test(`header fits at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/download-time-calculator");
      const headerOverflow = await page.getByRole("banner").evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(headerOverflow).toBeLessThanOrEqual(1);
      expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
      if (width >= 1280) {
        await expect(page.getByRole("button", { name: "Tools", exact: true })).toBeVisible();
        await expect(page.getByRole("link", { name: "Test Speed", exact: true })).toBeVisible();
      } else {
        await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Tools", exact: true })).toBeHidden();
      }
    });
  }

  test("dark mode keeps the header readable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const theme = await page.locator("html").getAttribute("data-theme");
    await page.getByRole("button", { name: theme === "dark" ? "Switch to light mode" : "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "dark" ? "light" : "dark");
    await expect(page.getByRole("button", { name: "Start Speed Test", exact: true })).toBeVisible();
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: "test-results/nav-redesign/after-desktop-dark.png" });
  });
});
