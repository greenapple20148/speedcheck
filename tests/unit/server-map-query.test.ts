import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsEmbedUrl,
  resolveServerMapQuery,
} from "@/lib/maps/server-map-query";
import type { ServerInfo } from "@/types/speedtest";

const baseServer: ServerInfo = {
  id: "us-east-1",
  name: "MySpeedGauge US",
  region: "us-east",
  location: "New York City",
  url: "https://measure.example.com",
  healthy: true,
};

describe("resolveServerMapQuery", () => {
  it("prefers coordinates when present", () => {
    const q = resolveServerMapQuery({
      ...baseServer,
      latitude: 40.7128,
      longitude: -74.006,
    });
    expect(q).toEqual({ kind: "coordinates", lat: 40.7128, lng: -74.006 });
  });

  it("falls back to place name for production location", () => {
    const q = resolveServerMapQuery(baseServer);
    expect(q).toEqual({ kind: "place", query: "New York City" });
  });

  it("returns null for local dev servers", () => {
    expect(
      resolveServerMapQuery({
        ...baseServer,
        id: "local-1",
        region: "local",
        location: "Development",
      }),
    ).toBeNull();
  });
});

describe("buildGoogleMapsEmbedUrl", () => {
  it("builds view URL for coordinates", () => {
    const url = buildGoogleMapsEmbedUrl(
      { kind: "coordinates", lat: 40.7, lng: -74.0 },
      "test-key",
    );
    expect(url).toContain("embed/v1/view");
    expect(url).toContain("center=40.7%2C-74");
  });

  it("builds place URL for named locations", () => {
    const url = buildGoogleMapsEmbedUrl(
      { kind: "place", query: "New York City" },
      "test-key",
    );
    expect(url).toContain("embed/v1/place");
    expect(url).toContain("q=New%20York%20City");
  });
});
