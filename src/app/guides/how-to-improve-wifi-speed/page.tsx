import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { AffiliateOffers } from "@/components/ads/affiliate-offers";
import { AFFILIATE_OFFERS } from "@/content/affiliates";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "How to Improve Wi‑Fi Speed",
  description:
    "Practical steps to boost Wi‑Fi: placement, bands, channels, mesh systems, and when to upgrade hardware.",
  path: "/guides/how-to-improve-wifi-speed",
});

export default function ImproveWifiGuide() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        items={[{ href: "/guides", label: "Guides" }, { label: "How to improve Wi‑Fi speed" }]}
        currentPath="/guides/how-to-improve-wifi-speed"
      />
      <h1 className="heading-1 text-foreground">How to Improve Wi‑Fi Speed</h1>
      <p className="mt-4 text-muted-foreground">
        Before buying new gear, confirm the problem is Wi‑Fi—not your ISP—with a{" "}
        <Link href="/wifi-speed-test" className="text-primary hover:underline">
          Wi‑Fi speed test
        </Link>{" "}
        versus a wired baseline.
      </p>
      <ol className="mt-8 list-decimal space-y-4 pl-5 text-muted-foreground">
        <li>
          <strong className="text-foreground">Place the router centrally and elevated.</strong> Avoid
          cabinets, floors, and metal shelves.
        </li>
        <li>
          <strong className="text-foreground">Use 5 GHz or 6 GHz near the router.</strong> Reserve 2.4
          GHz for distant IoT devices.
        </li>
        <li>
          <strong className="text-foreground">Pick a cleaner channel.</strong> Auto channel is fine for
          many homes; in apartments, a manual DFS or less crowded channel can help.
        </li>
        <li>
          <strong className="text-foreground">Update firmware</strong> on the gateway and any mesh
          nodes.
        </li>
        <li>
          <strong className="text-foreground">Add mesh nodes</strong> for multi-story homes instead of
          cheap repeaters that halve throughput. Plan the rooms in the{" "}
          <Link href="/mesh-wifi" className="text-primary hover:underline">
            mesh Wi-Fi planner
          </Link>{" "}
          and read{" "}
          <Link href="/mesh-wifi/guides/mesh-vs-extender" className="text-primary hover:underline">
            mesh versus an extender
          </Link>{" "}
          before you buy another box.
        </li>
      </ol>
      <AdSlot />
      <AffiliateOffers offers={AFFILIATE_OFFERS.filter((o) => o.id === "mesh-wifi")} />
    </article>
  );
}
