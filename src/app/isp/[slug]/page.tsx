import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { AffiliateOffers } from "@/components/ads/affiliate-offers";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { ISPS, getIsp } from "@/content/isps";
import { AFFILIATE_OFFERS } from "@/content/affiliates";
import { buildMetadata } from "@/lib/seo/metadata";
import { SpeedTestWidget } from "@/components/speedtest/speed-test-widget";
import { faqPageJsonLd, webApplicationJsonLd } from "@/lib/seo/structured-data";

export function generateStaticParams() {
  return ISPS.filter((i) => i.indexed).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const isp = getIsp(slug);
  if (!isp) return {};
  return buildMetadata({
    title: `${isp.name} Speed Test — Test Your Connection Speed`,
    description: `Test your ${isp.name} download, upload, ping, and jitter. Compare your speed test results against typical ${isp.name} speed plans and latency benchmarks.`,
    path: `/isp/${isp.slug}`,
    index: isp.indexed,
  });
}

export default async function IspPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const isp = getIsp(slug);
  if (!isp || !isp.indexed) notFound();

  const structured: Record<string, unknown>[] = [
    webApplicationJsonLd({
      name: `${isp.name} Speed Test`,
      description: isp.description,
      path: `/isp/${isp.slug}`,
    }),
  ];
  const faqLd = faqPageJsonLd(isp.faqs);
  if (faqLd) structured.push(faqLd);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={structured} />
      <Breadcrumbs items={[{ label: `${isp.name} Speed Test` }]} />
      
      <header className="mb-8 max-w-3xl">
        <h1 className="heading-1 text-foreground">{isp.name} Speed Test</h1>
        <p className="mt-3 text-base leading-6 text-muted-foreground">{isp.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            Technology: {isp.technology}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
            Typical Down: {isp.typicalDownloadMbps[0]}–{isp.typicalDownloadMbps[1]} Mbps
          </span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
            Typical Up: {isp.typicalUploadMbps[0]}–{isp.typicalUploadMbps[1]} Mbps
          </span>
        </div>
      </header>

      {/* Speed Test Widget */}
      <SpeedTestWidget />

      {/* Popular Plans Table */}
      <section className="mt-12" aria-labelledby="plans-table-heading">
        <h2 id="plans-table-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Popular {isp.name} Broadband Speed Tiers
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Compare your measured speed test result against official advertised speeds for {isp.name}.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Plan Name</th>
                <th className="px-4 py-3">Download Speed</th>
                <th className="px-4 py-3">Upload Speed</th>
                <th className="px-4 py-3">Recommended For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {isp.plans.map((p) => (
                <tr key={p.name} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-primary font-medium">{p.downloadMbps} Mbps</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{p.uploadMbps} Mbps</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.idealFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Equipment & Network Details */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            {isp.name} Equipment & Gateway Advice
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isp.equipmentAdvice}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Network Performance & Realities
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {isp.notes.map((n) => (
              <li key={n} className="flex items-start gap-2">
                <span className="font-bold text-foreground">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ad slot */}
      <div className="mt-12">
        <AdSlot className="mx-auto max-w-3xl" />
      </div>

      {/* Affiliate Offers */}
      <div className="mt-12">
        <AffiliateOffers offers={AFFILIATE_OFFERS} />
      </div>

      {/* Provider FAQs */}
      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl mb-4">
          Frequently Asked Questions About {isp.name}
        </h2>
        <FaqSection items={isp.faqs} />
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Explore more diagnostics on our{" "}
        <Link href="/internet-speed-test" className="text-primary hover:underline">
          internet speed test
        </Link>
        , check{" "}
        <Link href="/bufferbloat-test" className="text-primary hover:underline">
          bufferbloat
        </Link>
        , or read{" "}
        <Link href="/guides/what-is-good-internet-speed" className="text-primary hover:underline">
          what is a good internet speed
        </Link>
        .
      </p>
    </div>
  );
}
