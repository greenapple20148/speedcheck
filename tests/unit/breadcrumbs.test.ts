import { describe, expect, it } from "vitest";
import { breadcrumbListJsonLd } from "@/lib/seo/structured-data";

describe("breadcrumb structured data", () => {
  it("includes the section and the current page url", () => {
    const data = breadcrumbListJsonLd([
      { label: "Mesh Wi-Fi", href: "/mesh-wifi" },
      { label: "Mesh Wi-Fi placement", href: "/mesh-wifi/planner" },
    ]);
    const items = data.itemListElement as Array<{ name: string; item?: string; position: number }>;
    expect(items.map((item) => item.name)).toEqual(["Home", "Mesh Wi-Fi", "Mesh Wi-Fi placement"]);
    expect(items[1]?.item).toContain("/mesh-wifi");
    expect(items[2]?.item).toContain("/mesh-wifi/planner");
    expect(items[2]?.position).toBe(3);
  });
});
