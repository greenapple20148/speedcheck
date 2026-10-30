import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { AffiliateOffers } from "@/components/ads/affiliate-offers";
import { ISPS, getIsp } from "@/content/isps";
import { AFFILIATE_OFFERS } from "@/content/affiliates";
import { buildMetadata } from "@/lib/seo/metadata";
import { SpeedTestWidget } from "@/components/speedtest/speed-test-widget";

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
    title: `${isp.name} Speed Test`,
    description: `Test your ${isp.name} internet speed and see typical download/upload ranges.`,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ label: `${isp.name} speed test` }]} />
      <header className="mb-8 max-w-3xl">
        <h1 className="heading-1 text-foreground">{isp.name} Speed Test</h1>
        <p className="mt-3 text-muted-foreground">{isp.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Typical ranges: {isp.typicalDownloadMbps[0]}–{isp.typicalDownloadMbps[1]} Mbps down ·{" "}
          {isp.typicalUploadMbps[0]}–{isp.typicalUploadMbps[1]} Mbps up (varies by plan and market).
        </p>
      </header>
      <SpeedTestWidget />
      <ul className="mx-auto mt-10 max-w-3xl list-disc space-y-2 pl-5 text-muted-foreground">
        {isp.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <AdSlot className="mx-auto max-w-3xl" />
      <div className="mt-8">
        <AffiliateOffers offers={AFFILIATE_OFFERS} />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Also see{" "}
        <Link href="/internet-speed-test" className="text-primary hover:underline">
          internet speed test
        </Link>{" "}
        and{" "}
        <Link href="/guides/what-is-good-internet-speed" className="text-primary hover:underline">
          what is a good internet speed
        </Link>
        .
      </p>
    </div>
  );
}
