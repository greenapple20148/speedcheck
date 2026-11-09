import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { LOCATIONS, getLocation } from "@/content/locations";
import { buildMetadata } from "@/lib/seo/metadata";
import { SpeedTestWidget } from "@/components/speedtest/speed-test-widget";
import { faqPageJsonLd, webApplicationJsonLd } from "@/lib/seo/structured-data";

export function generateStaticParams() {
  return LOCATIONS.filter((l) => l.indexed).map((l) => ({
    state: l.stateSlug,
    city: l.citySlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}): Promise<Metadata> {
  const { state, city } = await params;
  const loc = getLocation(state, city);
  if (!loc) return {};
  return buildMetadata({
    title: `Internet Speed Test in ${loc.city}, ${loc.state} — Local Broadband Benchmark`,
    description: `Test your broadband internet speed in ${loc.city}, ${loc.state}. Compare your download and upload speeds against local ${loc.city} averages and top fiber/cable providers.`,
    path: `/locations/${loc.stateSlug}/${loc.citySlug}`,
    index: loc.indexed,
  });
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state, city } = await params;
  const loc = getLocation(state, city);
  if (!loc || !loc.indexed) notFound();

  const structured: Record<string, unknown>[] = [
    webApplicationJsonLd({
      name: `Internet Speed Test in ${loc.city}, ${loc.state}`,
      description: loc.summary,
      path: `/locations/${loc.stateSlug}/${loc.citySlug}`,
    }),
  ];
  const faqLd = faqPageJsonLd(loc.faqs);
  if (faqLd) structured.push(faqLd);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={structured} />
      <Breadcrumbs
        items={[
          { label: loc.state },
          { label: `${loc.city} Speed Test` },
        ]}
      />

      <header className="mb-8 max-w-3xl">
        <h1 className="heading-1 text-foreground">
          Internet Speed Test in {loc.city}, {loc.state}
        </h1>
        <p className="mt-3 text-base leading-6 text-muted-foreground">{loc.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            Local Avg Download: ~{loc.avgDownloadMbps} Mbps
          </span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
            Local Avg Upload: ~{loc.avgUploadMbps} Mbps
          </span>
        </div>
      </header>

      {/* Speed Test Widget */}
      <SpeedTestWidget />

      {/* Local Providers Table */}
      <section className="mt-12" aria-labelledby="providers-heading">
        <h2 id="providers-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Major Internet Providers in {loc.city}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Top broadband options, connection technologies, and maximum speeds available in {loc.city}.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Network Type</th>
                <th className="px-4 py-3">Estimated Coverage</th>
                <th className="px-4 py-3">Top Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {loc.providers.map((p) => (
                <tr key={p.name} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.coverage}</td>
                  <td className="px-4 py-3 font-mono font-medium text-primary">{p.topSpeed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Local Infrastructure & Tips */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Broadband Infrastructure in {loc.city}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {loc.broadbandLandscape}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Local Networking & Wi-Fi Tips
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {loc.tips.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="font-bold text-foreground">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Local FAQs */}
      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl mb-4">
          Frequently Asked Questions About {loc.city} Internet
        </h2>
        <FaqSection items={loc.faqs} />
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Compare providers on our{" "}
        <Link href="/isp/verizon-fios" className="text-primary hover:underline">
          ISP guides
        </Link>
        , run a{" "}
        <Link href="/wifi-speed-test" className="text-primary hover:underline">
          Wi-Fi test
        </Link>
        , or read{" "}
        <Link href="/guides/why-is-my-internet-slow" className="text-primary hover:underline">
          why internet feels slow
        </Link>
        .
      </p>
    </div>
  );
}
