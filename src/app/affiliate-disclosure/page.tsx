import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Affiliate Disclosure",
  description: "How MySpeedGauge discloses sponsored and affiliate relationships.",
  path: "/affiliate-disclosure",
});

export default function AffiliateDisclosurePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Affiliate disclosure" }]} />
      <article className="prose prose-neutral max-w-none prose-headings:font-heading">
      <h1>Affiliate Disclosure</h1>
      <p>
        Some links and offer cards on SpeedCheck are sponsored or affiliate links. We may earn a
        commission if you click or purchase—at no extra cost to you.
      </p>
      <p>
        Sponsored placements are labeled. Affiliate links use <code>rel=&quot;sponsored&quot;</code> where
        appropriate. Recommendations are not paid ranking of speed test results.
      </p>
    </article>
    </div>
  );
}
