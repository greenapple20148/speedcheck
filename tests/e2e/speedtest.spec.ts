import { test, expect } from "@playwright/test";

test.describe("real measurement flow", () => {
  test("lightweight GO completes with metrics", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    await page.getByRole("button", { name: "Lightweight", exact: true }).click();
    await page.getByRole("button", { name: "GO", exact: true }).click();
    await expect(
      page.getByText(/Preparing|Measuring|Testing download|Testing upload|Saving|Test complete/i).first(),
    ).toBeVisible();
    await expect(page.getByText("Test complete", { exact: true })).toBeVisible({
      timeout: 75_000,
    });
    await expect(page.getByText("Download").first()).toBeVisible();
    // After completion, download Mbps should not remain as an em dash placeholder
    await expect(page.locator(".speed-value")).not.toHaveText("—");
  });
});

test.describe("responsive + a11y smoke", () => {
  test("mobile viewport keeps GO usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const go = page.getByRole("button", { name: "GO", exact: true });
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
