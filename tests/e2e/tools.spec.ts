import { expect, test } from "@playwright/test";

test.describe("tool flows", () => {
  test("download calculator shows theoretical time", async ({ page }) => {
    await page.goto("/download-time-calculator");
    await expect(page).toHaveTitle(/download/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /download-time-calculator/);
    await expect(page.getByText("1 min 20 sec")).toBeVisible();
  });

  test("troubleshooter returns a checklist", async ({ page }) => {
    await page.goto("/internet-troubleshooter");
    await page.getByLabel("Internet is slow").check();
    await page.getByRole("button", { name: "Show checks" }).click();
    await expect(page.getByRole("heading", { name: "Diagnosis" })).toBeVisible();
    await expect(page.getByText(/Why:/).first()).toBeVisible();
  });

  test("mobile menu reaches guides", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: "Guides", exact: true }).first().click();
    await expect(page).toHaveURL(/\/guides$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("saved history can be deleted", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "speedcheck_history",
        JSON.stringify([
          {
            id: "localhistory01",
            downloadMbps: 100,
            uploadMbps: 20,
            pingMs: 12,
            jitterMs: 2,
            mode: "lightweight",
            createdAt: "2026-11-01T12:00:00.000Z",
            persisted: false,
          },
        ]),
      );
    });
    await page.goto("/history");
    await expect(page.getByText("100.0 Mbps").or(page.getByText("100 Mbps"))).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete all saved tests" }).click();
    await expect(page.getByText("No saved tests yet")).toBeVisible();
  });

  test("a failed session shows an error instead of a speed", async ({ page }) => {
    await page.route("**/sessions", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Measurement service unavailable" }),
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Start Speed Test", exact: true }).click();
    await expect(page.getByText("Measurement service unavailable")).toBeVisible();
    await expect(page.locator(".speed-value")).toHaveText("—");
  });

  test("an in-progress test can be canceled", async ({ page, request }) => {
    const health = await request.get("http://127.0.0.1:18443/health").catch(() => null);
    test.skip(!health?.ok(), "local measurement service is not running");
    await page.goto("/");
    await page.getByRole("button", { name: "Start Speed Test", exact: true }).click();
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(page.getByText("Test cancelled")).toBeVisible();
  });
});
