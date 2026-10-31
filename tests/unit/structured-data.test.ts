import { describe, expect, it } from "vitest";
import {
  breadcrumbListJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
} from "@/lib/seo/structured-data";

describe("structured-data", () => {
  it("builds organization with MySpeedGauge", () => {
    const org = organizationJsonLd();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("MySpeedGauge");
  });

  it("builds breadcrumb list with home first", () => {
    const data = breadcrumbListJsonLd([{ label: "Internet speed test", href: "/internet-speed-test" }]);
    const items = data.itemListElement as Array<{ position: number; name: string }>;
    expect(items[0]?.name).toBe("Home");
    expect(items[1]?.name).toBe("Internet speed test");
  });

  it("returns null FAQ schema for empty list", () => {
    expect(faqPageJsonLd([])).toBeNull();
  });
});
