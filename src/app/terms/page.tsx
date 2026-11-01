import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description: "Terms governing use of the MySpeedGauge speed testing platform.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Terms" }]} />
      <article className="prose prose-neutral max-w-none prose-headings:font-heading">
      <h1>Terms of Use</h1>
      <p>
        SpeedCheck provides informational network measurements. Results vary with device, Wi‑Fi,
        congestion, and server load. Do not use SpeedCheck to attack, overload, or abuse measurement
        infrastructure.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Automated scraping of measurement endpoints, bypassing session budgets, or redistributing
        transfer capacity is prohibited. We may rate-limit or block abusive clients.
      </p>
      <h2>Disclaimer</h2>
      <p>
        Measurements are provided as-is without warranty. They are not a contractual guarantee of ISP
        performance.
      </p>
    </article>
    </div>
  );
}
