import { expect, test } from "@playwright/test";

test.describe("bandwidth usage estimator", () => {
  test("updates live, rejects a bad plan, and stays within the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/internet-speed-calculator");
    await expect(page).toHaveTitle(/Internet Speed Calculator/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /internet-speed-calculator/);
    await expect(page.getByRole("heading", { level: 1, name: "Bandwidth Usage Estimator" })).toBeVisible();
    await expect(page.getByText("Find out how much internet speed your household really needs.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Use my latest speed test" })).toHaveCount(0);

    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(1);

    const download = page.getByRole("region", { name: "Download Required" });
    const upload = page.getByRole("region", { name: "Upload Required" });
    await expect(download).toContainText("0 Mbps");
    await expect(upload).toContainText("0 Mbps");

    const increaseBrowsing = page.getByRole("button", { name: "Increase Web browsing" });
    await increaseBrowsing.focus();
    await page.keyboard.press("Enter");
    await expect(download).toContainText("3 Mbps");
    await expect(upload).toContainText("1 Mbps");
    await expect(page.getByRole("checkbox", { name: "Web browsing" })).toBeChecked();

    await page.getByRole("button", { name: "Decrease Web browsing" }).click();
    await expect(download).toContainText("0 Mbps");
    await expect(page.getByRole("checkbox", { name: "Web browsing" })).not.toBeChecked();
    await expect(page.getByRole("button", { name: "Decrease Web browsing" })).toBeDisabled();

    await page.getByRole("checkbox", { name: "Web browsing" }).check();
    await expect(download).toContainText("3 Mbps");
    await page.getByRole("checkbox", { name: "Web browsing" }).uncheck();
    await expect(download).toContainText("0 Mbps");

    await page.getByRole("button", { name: "Family streaming" }).click();
    await expect(download).toContainText("41 Mbps");
    await expect(upload).toContainText("4 Mbps");
    await expect(page.getByRole("button", { name: "Family streaming" })).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(download).toContainText("0 Mbps");
    await expect(upload).toContainText("0 Mbps");
    await expect(page.getByLabel("Download Mbps")).toHaveValue("300");
    await expect(page.getByLabel("Upload Mbps")).toHaveValue("20");

    await page.getByLabel("Download Mbps").fill("0");
    await expect(page.getByRole("alert").filter({ hasText: "Enter a speed greater than 0." })).toBeVisible();
    await expect(page.getByText("NaN")).toHaveCount(0);
    await expect(page.getByText("Infinity")).toHaveCount(0);
    await page.getByLabel("Download Mbps").fill("abc");
    await expect(page.getByRole("alert").filter({ hasText: "Enter a positive number in Mbps." })).toBeVisible();
    await page.getByLabel("Download Mbps").fill("300");
    await expect(page.getByRole("region", { name: "Your Internet Plan" }).getByRole("alert")).toHaveCount(0);

    await page.getByText("How it works").click();
    await expect(page.getByText("They are not a live measurement from your modem.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Common activity bandwidth" })).toBeVisible();

    expect(await overflow()).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 768, height: 1024 });
    expect(await overflow()).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await overflow()).toBeLessThanOrEqual(1);

    await page.getByRole("button", { name: "Increase HD streaming (1080p)" }).click();
    await expect(download).toContainText("5 Mbps");
    await expect(upload).toContainText("0.5 Mbps");
    expect(await overflow()).toBeLessThanOrEqual(1);
  });

  test("starts from a saved plan and applies a speed test only when asked", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("speedcheck_plan", JSON.stringify({ downloadMbps: 100, uploadMbps: 10 }));
      localStorage.setItem(
        "speedcheck_history",
        JSON.stringify([
          {
            id: "latest-speed",
            downloadMbps: 80,
            uploadMbps: 8,
            pingMs: 12,
            jitterMs: 2,
            mode: "standard",
            createdAt: "2026-11-01T12:00:00.000Z",
          },
        ]),
      );
    });
    await page.goto("/internet-speed-calculator");
    await expect(page.getByLabel("Download Mbps")).toHaveValue("100");
    await expect(page.getByLabel("Upload Mbps")).toHaveValue("10");
    await expect(page.getByText("Started from the plan saved in this browser.")).toBeVisible();
    await page.getByRole("button", { name: "Use my latest speed test" }).click();
    await expect(page.getByLabel("Download Mbps")).toHaveValue("80");
    await expect(page.getByLabel("Upload Mbps")).toHaveValue("8");
    await expect(page.getByText("Filled from your latest speed test. This is a measurement, not your subscribed plan.")).toBeVisible();
  });
});
