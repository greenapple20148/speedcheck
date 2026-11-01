import { describe, expect, it } from "vitest";
import {
  gatewaySuggestionsFor,
  getRouterManufacturer,
  localAdminPageProvider,
  parseGatewayAddress,
} from "@/lib/mesh/router-admin";

describe("gateway address validation", () => {
  it("builds an http URL for a private IPv4 gateway", () => {
    const parsed = parseGatewayAddress(" 192.168.1.1 ");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.url).toBe("http://192.168.1.1/");
    expect(parsed.kind).toBe("ipv4");
    expect(parsed.typicalLocalGateway).toBe(true);
    expect(localAdminPageProvider.buildAdminUrl("192.168.1.1")).toBe("http://192.168.1.1/");
  });

  it("accepts IPv6 and brackets it", () => {
    const local = parseGatewayAddress("fe80::1");
    const loopback = parseGatewayAddress("https://[::1]/");
    expect(local.ok && local.url).toBe("http://[fe80::1]/");
    expect(local.ok && local.typicalLocalGateway).toBe(true);
    expect(loopback.ok && loopback.url).toBe("https://[::1]/");
    expect(loopback.ok && loopback.scheme).toBe("https");
  });

  it("accepts local and vendor hostnames and keeps an explicit port", () => {
    expect(parseGatewayAddress("router.local").ok && parseGatewayAddress("router.local")).toMatchObject({
      ok: true,
      url: "http://router.local/",
      kind: "hostname",
    });
    expect(parseGatewayAddress("routerlogin.net").ok && parseGatewayAddress("routerlogin.net")).toMatchObject({
      url: "http://routerlogin.net/",
    });
    expect(parseGatewayAddress("192.168.0.1:8443")).toMatchObject({
      ok: true,
      url: "http://192.168.0.1:8443/",
      port: "8443",
    });
  });

  it("rejects public hostnames, credentials, paths, and malformed addresses", () => {
    expect(parseGatewayAddress("evil.com").ok).toBe(false);
    expect(parseGatewayAddress("http://user:secret@192.168.1.1/").ok).toBe(false);
    expect(parseGatewayAddress("http://192.168.1.1/admin").ok).toBe(false);
    expect(parseGatewayAddress("javascript:alert(1)").ok).toBe(false);
    expect(parseGatewayAddress("256.1.1.1").ok).toBe(false);
    expect(parseGatewayAddress("192.168.001.1").ok).toBe(false);
    expect(parseGatewayAddress("").ok).toBe(false);
    expect(localAdminPageProvider.buildAdminUrl("evil.com")).toBeNull();
  });

  it("flags a public IPv4 address without rejecting the format", () => {
    const parsed = parseGatewayAddress("8.8.8.8");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.typicalLocalGateway).toBe(false);
  });
});

describe("router manufacturer guidance", () => {
  it("sends eero and Google Nest to their apps", () => {
    const eero = getRouterManufacturer("eero");
    const nest = getRouterManufacturer("google-nest");
    expect(eero?.management).toBe("app");
    expect(eero?.appName).toBe("eero app");
    expect(eero?.steps.join(" ")).toContain("eero app");
    expect(nest?.management).toBe("app");
    expect(nest?.steps.join(" ")).toContain("Google Home");
    expect(eero?.supportUrl).toMatch(/^https:\/\/support\.eero\.com/);
  });

  it("offers editable common gateway suggestions without claiming one model", () => {
    expect(gatewaySuggestionsFor("asus")).toEqual([
      "192.168.50.1",
      "192.168.1.1",
      "router.asus.com",
      "192.168.0.1",
      "192.168.1.254",
      "10.0.0.1",
    ]);
    expect(gatewaySuggestionsFor("other")).toContain("192.168.1.1");
  });

  it("does not put a password field on the local admin provider", () => {
    expect(Object.keys(localAdminPageProvider)).not.toContain("password");
    expect(localAdminPageProvider.authorization).toBe("none");
  });
});
