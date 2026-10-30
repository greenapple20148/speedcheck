export interface AffiliateOffer {
  id: string;
  provider: string;
  title: string;
  description: string;
  url: string;
  cta: string;
  regions?: string[];
}

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: "compare-fiber",
    provider: "FiberCompare",
    title: "Compare fiber plans near you",
    description:
      "See which providers offer 500 Mbps–2 Gbps fiber in your ZIP code. Availability varies.",
    url: "https://example.com/affiliates/fiber-compare?ref=speedcheck",
    cta: "Check availability",
    regions: ["us"],
  },
  {
    id: "mesh-wifi",
    provider: "HomeNet Gear",
    title: "Upgrade to a mesh Wi‑Fi system",
    description:
      "If your speed test is fast on Ethernet but slow on Wi‑Fi, a modern mesh kit often helps.",
    url: "https://example.com/affiliates/mesh-wifi?ref=speedcheck",
    cta: "Shop mesh kits",
  },
];
