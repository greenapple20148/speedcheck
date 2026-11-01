import { expect, test } from "@playwright/test";

const history = [{
  id: "health-1",
  downloadMbps: 100,
  uploadMbps: 4,
  pingMs: 18,
  jitterMs: 30,
  mode: "standard",
  serverName: "Edge A",
  createdAt: "2026-11-01T13:00:00.000Z",
  bufferbloatIdleMs: 16,
  bufferbloatLoadedDownMs: 120,
  bufferbloatLoadedUpMs: 40,
  bufferbloatGrade: "D",
  provider: "cloudflare",
  connectionTag: "wifi",
}, {
  id: "health-2",
  downloadMbps: 140,
  uploadMbps: 8,
  pingMs: 15,
  jitterMs: 6,
  mode: "standard",
  serverName: "Edge B",
  createdAt: "2026-11-01T12:00:00.000Z",
  bufferbloatIdleMs: 14,
  bufferbloatLoadedDownMs: 28,
  bufferbloatLoadedUpMs: 20,
  bufferbloatGrade: "B",
  provider: "cloudflare",
  connectionTag: "wifi",
}];

const meshPlan = {
  schemaVersion: 1,
  updatedAt: "2026-11-01T12:00:00.000Z",
  wizardStep: 0,
  home: {
    area: 1200, unit: "sqft", floors: 1, construction: "drywall", devices: 4,
    ispMbps: null, connection: "unknown", usage: [], networkName: "", brandSlug: "generic",
    backhaul: "unknown", coax: false,
  },
  floors: [{
    id: "floor-1", name: "Floor 1", widthFt: 40, heightFt: 30,
    rooms: [{ id: "room-kitchen", name: "Kitchen", x: 2, y: 2, w: 10, h: 10, material: "drywall", priority: false, problem: false }],
    nodes: [], outlets: [], walls: [], imageDataUrl: null,
  }],
  activeFloorId: "floor-1",
  measurements: [{
    roomId: "room-kitchen", downloadMbps: 42, uploadMbps: 11, pingMs: 21, jitterMs: 5,
    testedAt: "2026-11-01T12:30:00.000Z", endpointName: "Edge A",
  }],
  checkedSetup: [],
};

test.describe("network health", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ historyRows, plan }) => {
      localStorage.setItem("speedcheck_history", JSON.stringify(historyRows));
      localStorage.setItem("myspeedgauge_mesh_plan_v1", JSON.stringify(plan));
    }, { historyRows: history, plan: meshPlan });
  });

  test("shows saved measurements and does not invent stability", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/network-health?room=room-kitchen");
    await expect(page.getByRole("heading", { level: 1, name: "Network health" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Download", exact: true }).locator("xpath=ancestor::article")).toContainText("100");
    await expect(page.getByText("Cloudflare").first()).toBeVisible();
    await expect(page.getByText("Not measured").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Loaded latency is high" })).toBeVisible();
    await expect(page.getByText("Kitchen")).toBeVisible();
    await expect(page.getByText("42 Mbps")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("compares a baseline, warns about servers, and keeps the note local", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("192.168.") || (request.postData() ?? "").includes("Edge A")) requests.push(request.url());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/network-health/compare");
    await expect(page.getByLabel("What changed")).toContainText("Ethernet backhaul installation");
    await expect(page.getByRole("button", { name: "Run follow-up test" })).toBeVisible();
    await page.getByRole("group", { name: "Baseline" }).getByRole("radio", { name: /Edge A/ }).check();
    await page.getByRole("group", { name: "Follow-up" }).getByRole("radio", { name: /Edge B/ }).check();
    await expect(page.getByText("The tests used different servers: Edge A and Edge B.")).toBeVisible();
    await page.getByLabel("Note").fill("Moved the living room node");
    await page.getByRole("button", { name: "Save comparison" }).click();
    await expect(page.getByText("improvement").first()).toBeVisible();
    await page.getByLabel("Note").fill("password hunter2");
    await page.getByRole("button", { name: "Save comparison" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /password/i })).toBeVisible();
    expect(requests).toEqual([]);
    await page.reload();
    await expect(page.getByRole("button", { name: /Mesh node relocation/ })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("blank storage does not invent measurements", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("speedcheck_history");
      localStorage.removeItem("myspeedgauge_mesh_plan_v1");
    });
    await page.goto("/network-health");
    await expect(page.getByText("No saved test")).toBeVisible();
    await expect(page.getByText("No recommendation yet. The rules wait for a measured problem.")).toBeVisible();
    await expect(page.getByText("A complete download, upload, latency, and jitter result is required")).toBeVisible();
    await expect(page.getByText("No rooms are saved in the mesh planner.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Mesh coverage" })).toContainText("Add a node");
    await expect(page.getByRole("region", { name: "Connected devices" })).toContainText("does not list devices");
    await expect(page.getByRole("region", { name: "Router status" })).toContainText("does not connect");
    await expect(page.getByRole("region", { name: "Before and after" })).toContainText("No saved comparison");
  });
});
