import { test, expect } from "@playwright/test";

test.describe("real measurement flow", () => {
  test("lightweight GO completes with metrics", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    await page.getByRole("button", { name: "Lightweight", exact: true }).click();
    await page.getByRole("button", { name: "Start Speed Test", exact: true }).click();
    await expect(
      page.getByText(/Preparing|Measuring|Testing download|Testing upload|Saving/i).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Test Again", exact: true })).toBeVisible({
      timeout: 75_000,
    });
    await expect(page.getByRole("heading", { name: "Download", exact: true })).toBeVisible();
    // After completion, download Mbps should not remain as an em dash placeholder
    await expect(page.locator(".speed-value")).not.toHaveText("—");
  });

  test("standard test measures latency during transfer", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    await page.getByRole("button", { name: "Standard", exact: true }).click();
    await page.getByRole("button", { name: "Start Speed Test", exact: true }).click();
    await expect(page.getByRole("button", { name: "Test Again", exact: true })).toBeVisible({
      timeout: 80_000,
    });
    await page.getByRole("button", { name: "View detailed diagnostics" }).click();
    const loaded = page.getByText("Download-loaded ping").locator("xpath=..");
    await expect(loaded).toContainText(/\d+(\.\d+)? ms/);
    await expect(loaded).not.toContainText("Not measured");
  });
});

test.describe("responsive + a11y smoke", () => {
  for (const size of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ]) {
    test(`primary UI fits viewport ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/");
      const start = page.getByRole("button", { name: "Start Speed Test", exact: true });
      await expect(start).toBeVisible();
      await expect(start).toBeInViewport();
      await expect(page.getByRole("heading", { name: "Download", exact: true })).toBeInViewport();
      await expect(page.getByRole("heading", { name: "Upload", exact: true })).toBeInViewport();
      await expect(page.getByRole("heading", { name: "Latency", exact: true })).toBeInViewport();
      await expect(page.getByRole("heading", { name: "Jitter", exact: true })).toBeInViewport();
      await expect(page.getByText("Lightweight", { exact: true })).toBeInViewport();
    });
  }

  test("mobile viewport keeps GO usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const go = page.getByRole("button", { name: "Start Speed Test", exact: true });
    await expect(go).toBeVisible();
    const box = await go.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(100);
  });

  test("primary landmarks and labels exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("Internet speed test")).toBeVisible();
  });
});

test.describe("seo validation", () => {
  test("sitemap and canonical pages", async ({ request, page }) => {
    const sm = await request.get("/sitemap.xml");
    expect(sm.ok()).toBeTruthy();
    const xml = await sm.text();
    expect(xml).toContain("/internet-speed-test");
    expect(xml).not.toContain("/admin/");
    expect(xml).not.toContain("/results/");

    await page.goto("/guides/what-is-good-internet-speed");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("good");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /what-is-good-internet-speed/);
  });
});
