import { expect, test } from "@playwright/test";

const widths = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test.describe("homepage navigation", () => {
  for (const viewport of widths) {
    test(`${viewport.name} keeps the speed test in view without overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      const start = page.getByRole("button", { name: "Start Speed Test", exact: true });
      await expect(start).toBeVisible();
      await expect(start).toBeInViewport();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: `test-results/nav-redesign/after-${viewport.name}.png`,
        fullPage: false,
      });
    });
  }

  test("desktop tools menu stays in the viewport and reaches a real route", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const tools = page.getByRole("button", { name: "Tools", exact: true });
    await tools.hover();
    const menu = page.getByRole("region", { name: "Tools" });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1440);
    await page.screenshot({ path: "test-results/nav-redesign/after-desktop-menu.png" });
    await menu.getByRole("link", { name: "Ping Test", exact: true }).click();
    await expect(page).toHaveURL(/\/ping-test$/);
  });

  test("escape and outside click close the tools menu", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const tools = page.getByRole("button", { name: "Tools", exact: true });
    await tools.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("region", { name: "Tools" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await tools.click();
    await expect(menu).toBeVisible();
    await page.mouse.click(20, 700);
    await expect(menu).toBeHidden();
  });

  test("tablet drawer groups tools and keeps the speed test linked", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog.getByRole("link", { name: "Speed Test", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Diagnostics" }).click();
    await dialog.getByRole("link", { name: "Connection Stability", exact: true }).click();
    await expect(page).toHaveURL(/\/connection-stability-test$/);
  });

  test("dark mode keeps the header readable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const theme = await page.locator("html").getAttribute("data-theme");
    await page.getByRole("button", { name: theme === "dark" ? "Switch to light mode" : "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "dark" ? "light" : "dark");
    await expect(page.getByRole("button", { name: "Start Speed Test", exact: true })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: "test-results/nav-redesign/after-desktop-dark.png" });
  });
});
