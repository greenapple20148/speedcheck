import type { Metadata } from "next";
import Link from "next/link";
import { FloorPlannerLoader } from "@/components/mesh/floor-planner-loader";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqPageJsonLd, webApplicationJsonLd } from "@/lib/seo/structured-data";

const faqs = [
  { question: "Does the color show my real signal?", answer: "No. The planner labels the colors as estimated coverage. They are not a measured signal map, not RSSI, and not a throughput prediction." },
  { question: "What does acceptable coverage mean?", answer: "Acceptable means the estimate is strong or moderate. Weak and very weak are the areas the same model marks as needing attention. The share is of modeled floor area inside drawn rooms, or the whole floor when no rooms are drawn." },
];

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Placement",
  description: "Plan mesh Wi-Fi placement: draw rooms, drag nodes, and view an estimated coverage map saved on this device.",
  path: "/mesh-wifi/planner",
});

export default function PlannerPage() {
  return (
    <>
      <JsonLd data={[
        webApplicationJsonLd({
          name: "Mesh Wi-Fi placement",
          description: "Interactive floor plan for estimated mesh coverage",
          path: "/mesh-wifi/planner",
        }),
        faqPageJsonLd(faqs),
      ].filter((item) => item != null)} />
      <div className="flex h-[calc(100dvh-7.75rem)] min-h-0 flex-col px-2 pb-2 sm:px-3">
        <FloorPlannerLoader />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-xs text-muted-foreground">{meshCrumbs("Mesh Wi-Fi placement").map((crumb) => crumb.label).join(" / ")}</p>
        <section className="mt-6" aria-labelledby="method-heading">
          <h2 id="method-heading" className="text-lg font-semibold text-foreground">How this estimate works</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The estimate starts near a node and subtracts distance, a typical loss when the path enters a room, and loss for each drawn wall the path crosses. A node on another floor pays an extra penalty. Open-air loss is higher at 5 GHz than at 2.4 GHz, and higher again at 6 GHz. Those rates are planning assumptions, not a survey of your home. The colors are categories on that score. They are not dBm and not a promise of speed. Undo and redo apply to plan edits saved in this browser.
          </p>
        </section>
        <div className="mt-10">
          <FaqSection items={faqs} />
        </div>
        <nav className="mt-10" aria-label="Related pages">
          <h2 className="text-lg font-semibold text-foreground">Related</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            <li><Link href="/mesh-wifi/guides/where-to-place-mesh-nodes" className="text-sm font-medium text-primary hover:underline">Placement guide</Link></li>
            <li><Link href="/mesh-wifi/dead-zone-test" className="text-sm font-medium text-primary hover:underline">Test a room</Link></li>
            <li><Link href="/mesh-wifi/placement-optimizer" className="text-sm font-medium text-primary hover:underline">Placement options</Link></li>
          </ul>
        </nav>
      </div>
    </>
  );
}
