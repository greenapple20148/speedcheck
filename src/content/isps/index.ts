export interface IspPage {
  slug: string;
  name: string;
  description: string;
  typicalDownloadMbps: [number, number];
  typicalUploadMbps: [number, number];
  notes: string[];
  indexed: boolean;
}

export const ISPS: IspPage[] = [
  {
    slug: "xfinity",
    name: "Xfinity",
    description:
      "Xfinity (Comcast) is a major US cable ISP offering DOCSIS broadband with asymmetric upload speeds. Speeds and availability vary by market.",
    typicalDownloadMbps: [100, 1200],
    typicalUploadMbps: [10, 35],
    notes: [
      "Cable networks are shared in a neighborhood node—evening slowdowns are possible.",
      "Upload is typically much lower than download on DOCSIS plans.",
      "Gateway Wi‑Fi quality varies; a third-party router in bridge mode can help.",
    ],
    indexed: true,
  },
  {
    slug: "verizon-fios",
    name: "Verizon Fios",
    description:
      "Verizon Fios delivers symmetrical fiber internet in select US markets with consistently low latency.",
    typicalDownloadMbps: [300, 2000],
    typicalUploadMbps: [300, 2000],
    notes: [
      "Fiber provides symmetrical upload/download on most consumer tiers.",
      "Latency is typically excellent for gaming and video calls.",
      "Availability is limited to Fios-served footprints.",
    ],
    indexed: true,
  },
  {
    slug: "att-fiber",
    name: "AT&T Fiber",
    description:
      "AT&T Fiber offers symmetrical gigabit-class fiber where available, with AT&T Internet Air and DSL in other areas.",
    typicalDownloadMbps: [300, 5000],
    typicalUploadMbps: [300, 5000],
    notes: [
      "Confirm you are on fiber—not DSL or fixed wireless—before comparing results.",
      "Gateway firmware and Wi‑Fi settings strongly affect indoor speeds.",
    ],
    indexed: true,
  },
];

export function getIsp(slug: string) {
  return ISPS.find((i) => i.slug === slug);
}
