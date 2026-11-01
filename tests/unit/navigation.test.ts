import { describe, expect, it } from "vitest";
import {
  HISTORY_HREF,
  NAV_ITEMS,
  SPEED_TEST_HREF,
  isCurrentPage,
  isNavItemActive,
  matchesHref,
  navItemLinks,
  showTestSpeedCta,
} from "@/content/navigation";

const tools = NAV_ITEMS.find((item) => item.id === "tools");
const wifi = NAV_ITEMS.find((item) => item.id === "wifi");
const health = NAV_ITEMS.find((item) => item.id === "health");
const guides = NAV_ITEMS.find((item) => item.id === "guides");
const speed = NAV_ITEMS.find((item) => item.id === "speed-test");

describe("navigation route matching", () => {
  it("marks an exact page current and ignores a lookalike prefix", () => {
    expect(isCurrentPage("/ping-test", "/ping-test")).toBe(true);
    expect(isCurrentPage("/network-health", "/network-health")).toBe(true);
    expect(isCurrentPage("/network-health/compare", "/network-health")).toBe(false);
    expect(matchesHref("/ping-test-extra", "/ping-test")).toBe(false);
    expect(matchesHref("/network-health-extra", "/network-health")).toBe(false);
    expect(matchesHref("/mesh", "/mesh-wifi")).toBe(false);
    expect(matchesHref("/guide", "/guides")).toBe(false);
  });

  it("highlights a parent for a nested child without highlighting an unrelated section", () => {
    expect(health).toBeTruthy();
    expect(tools).toBeTruthy();
    expect(wifi).toBeTruthy();
    expect(guides).toBeTruthy();
    expect(isNavItemActive("/network-health/compare", health!)).toBe(true);
    expect(isNavItemActive("/ping-test", health!)).toBe(true);
    expect(isNavItemActive("/ping-test", tools!)).toBe(false);
    expect(isNavItemActive("/mesh-wifi/planner", wifi!)).toBe(true);
    expect(isNavItemActive("/router-setup", wifi!)).toBe(true);
    expect(isNavItemActive("/mesh-wifi/planner", tools!)).toBe(false);
    expect(isNavItemActive("/guides/what-is-latency", guides!)).toBe(true);
    expect(isNavItemActive("/guides/what-is-latency", health!)).toBe(false);
    expect(isNavItemActive("/developer-tools/json-formatter", tools!)).toBe(true);
    expect(isNavItemActive("/developer-tools/base64", wifi!)).toBe(false);
    expect(isCurrentPage("/developer-tools/json-formatter", "/developer-tools")).toBe(false);
    expect(isCurrentPage("/developer-tools/json-formatter", "/developer-tools/json-formatter")).toBe(true);
  });

  it("treats the homepage as the speed test and keeps the test-speed call to action off those routes", () => {
    expect(speed).toBeTruthy();
    expect(isNavItemActive("/", speed!)).toBe(true);
    expect(isNavItemActive("/wifi-speed-test", speed!)).toBe(true);
    expect(isNavItemActive("/download-time-calculator", speed!)).toBe(false);
    expect(showTestSpeedCta("/")).toBe(false);
    expect(showTestSpeedCta(SPEED_TEST_HREF)).toBe(false);
    expect(showTestSpeedCta("/upload-speed-test")).toBe(false);
    expect(showTestSpeedCta("/download-time-calculator")).toBe(true);
    expect(showTestSpeedCta("/guides/what-is-latency")).toBe(true);
  });

  it("keeps every destination the previous header exposed", () => {
    const hrefs = new Set(NAV_ITEMS.flatMap((item) => [item.href, ...navItemLinks(item).map((link) => link.href)]).filter(Boolean));
    hrefs.add(HISTORY_HREF);
    for (const href of [
      "/speed-test",
      "/ping-test",
      "/jitter-test",
      "/bufferbloat-test",
      "/connection-stability-test",
      "/packet-loss-test",
      "/gaming-speed-test",
      "/streaming-speed-test",
      "/video-call-test",
      "/dns-speed-test",
      "/download-time-calculator",
      "/upload-time-calculator",
      "/mbps-to-mbs",
      "/internet-speed-calculator",
      "/mesh-wifi",
      "/network-health",
      "/guides",
      "/history",
    ]) {
      expect(hrefs.has(href)).toBe(true);
    }
    const menuHrefs = NAV_ITEMS.flatMap((item) => navItemLinks(item).map((link) => link.href));
    expect(new Set(menuHrefs).size).toBe(menuHrefs.length);
  });
});
