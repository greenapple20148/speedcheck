import { expect, test } from "@playwright/test";

test.describe("mesh wifi", () => {
  test("hub explains the planner and has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mesh-wifi");
    await expect(page.getByRole("heading", { level: 1, name: "Mesh Wi-Fi setup and placement" })).toBeVisible();
    await expect(page.getByRole("link", { name: "How many mesh nodes do I need?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Floor planner" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("node calculator shows a starting count", async ({ page }) => {
    await page.goto("/mesh-wifi/node-calculator");
    await expect(page.getByText("A mesh kit may be unnecessary")).toBeVisible();
    await expect(page.getByText("Suggested starting count")).toBeVisible();
  });

  test("planner adds a node", async ({ page }) => {
    await page.goto("/mesh-wifi/planner");
    await page.getByRole("button", { name: "Add node" }).click();
    await expect(page.getByText("Primary").first()).toBeVisible();
    await expect(page.getByText("Estimated coverage — not a measured Wi-Fi signal map.")).toBeVisible();
  });

  test("planner switches floors and keeps a saved node", async ({ page }) => {
    await page.goto("/mesh-wifi/planner");
    await page.getByRole("button", { name: "Add node" }).click();
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("button", { name: /Floor 2/ })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: /Floor 1/ }).click();
    await expect(page.getByText("Primary").first()).toBeVisible();
  });

  test("setup wizard links to official support", async ({ page }) => {
    await page.goto("/mesh-wifi/setup");
    await page.getByRole("radio", { name: "Amazon eero" }).check();
    await expect(page.getByRole("link", { name: /Official Amazon eero support/ })).toBeVisible();
  });

  test("room test does not start by itself", async ({ page }) => {
    await page.goto("/mesh-wifi/dead-zone-test");
    await expect(page.getByRole("button", { name: "Start Speed Test" })).toBeVisible();
    await expect(page.getByText("Nothing runs until you press Start.")).toBeVisible();
  });
});
