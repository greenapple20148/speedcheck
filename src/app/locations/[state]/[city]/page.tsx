import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LOCATIONS, getLocation } from "@/content/locations";
import { buildMetadata } from "@/lib/seo/metadata";
import { SpeedTestWidget } from "@/components/speedtest/speed-test-widget";

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
    title: `Internet Speed Test in ${loc.city}, ${loc.state}`,
    description: loc.summary,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        items={[
          { label: loc.state },
          { label: `${loc.city} speed test` },
        ]}
      />
      <header className="mb-8 max-w-3xl">
        <h1 className="heading-1 text-foreground">
          Internet Speed Test in {loc.city}, {loc.state}
        </h1>
        <p className="mt-3 text-muted-foreground">{loc.summary}</p>
      </header>
      <SpeedTestWidget />
      <h2 className="heading-2 mx-auto mt-12 max-w-3xl text-foreground">Local tips</h2>
      <ul className="mx-auto mt-4 max-w-3xl list-disc space-y-2 pl-5 text-muted-foreground">
        {loc.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="mx-auto mt-8 max-w-3xl text-sm text-muted-foreground">
        Compare providers on our{" "}
        <Link href="/isp/verizon-fios" className="text-primary hover:underline">
          ISP pages
        </Link>{" "}
        or read{" "}
        <Link href="/guides/why-is-my-internet-slow" className="text-primary hover:underline">
          why internet feels slow
        </Link>
        .
      </p>
    </div>
  );
}
