import { expect, test } from "@playwright/test";

test.describe("mesh wifi", () => {
  test("hub explains the planner and has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mesh-wifi");
    await expect(page.getByRole("heading", { level: 1, name: "Mesh Wi-Fi setup and placement" })).toBeVisible();
    await expect(page.getByRole("link", { name: "How many mesh nodes do I need?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mesh Planner" })).toBeVisible();
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

  test("router assistant opens only a confirmed local page", async ({ page }) => {
    const gateway = "192.168.8.1";
    const leaked: string[] = [];
    await page.addInitScript(() => {
      const original = window.open.bind(window);
      window.open = (url, target, features) => {
        const record = (window as unknown as { __routerOpens?: string[] });
        record.__routerOpens = [...(record.__routerOpens ?? []), String(url ?? "")];
        return original(url, target, features);
      };
    });
    page.on("request", (request) => {
      const target = `${request.url()} ${request.postData() ?? ""}`;
      if (target.includes(gateway) && !request.url().startsWith(`http://${gateway}`)) leaked.push(request.url());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mesh-wifi/planner");
    await page.getByRole("button", { name: "Connect to router" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Consumer eero systems are managed in the eero app")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open admin page" })).toHaveCount(0);
    await expect(page.locator("input[type='password']")).toHaveCount(0);

    await page.getByLabel("Router manufacturer").selectOption("netgear");
    await page.getByRole("button", { name: "192.168.1.1" }).click();
    await expect(page.getByLabel("Gateway address")).toHaveValue("192.168.1.1");
    await page.getByLabel("Gateway address").fill(gateway);
    await expect(page.getByLabel("Gateway address")).toHaveValue(gateway);
    await page.getByRole("checkbox", { name: /Open this address in a new tab/ }).check();
    await page.getByRole("button", { name: "Open admin page" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __routerOpens?: string[] }).__routerOpens?.[0] ?? "")).toBe(`http://${gateway}/`);
    expect(leaked).toEqual([]);
    await expect(page.getByText("That does not connect MySpeedGauge to the router.")).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Connect to router" }).click();
    await page.getByLabel("Router manufacturer").selectOption("netgear");
    await expect(page.getByLabel("Gateway address")).toHaveValue("");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("room test does not start by itself", async ({ page }) => {
    await page.goto("/mesh-wifi/dead-zone-test");
    await expect(page.getByRole("button", { name: "Start Speed Test" })).toBeVisible();
    await expect(page.getByText("Nothing runs until you press Start.")).toBeVisible();
  });
});
