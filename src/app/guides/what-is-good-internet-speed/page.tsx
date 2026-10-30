import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "What Is a Good Internet Speed?",
  description:
    "Learn what download, upload, ping, and jitter numbers are good enough for streaming, gaming, work-from-home, and large households.",
  path: "/guides/what-is-good-internet-speed",
});

const rows = [
  { use: "Browse & email", down: "10–25 Mbps", up: "3 Mbps", ping: "< 100 ms" },
  { use: "HD streaming (1–2 devices)", down: "25–50 Mbps", up: "5 Mbps", ping: "< 80 ms" },
  { use: "4K + video calls", down: "100–200 Mbps", up: "10–20 Mbps", ping: "< 50 ms" },
  { use: "Gaming (competitive)", down: "50+ Mbps", up: "10+ Mbps", ping: "< 30 ms" },
  { use: "Large household / hybrid work", down: "300–1000 Mbps", up: "20–100 Mbps", ping: "< 40 ms" },
];

export default function GoodSpeedGuide() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What Is a Good Internet Speed?",
          url: absoluteUrl("/guides/what-is-good-internet-speed"),
        }}
      />
      <Breadcrumbs items={[{ label: "What is a good internet speed?" }]} />
      <h1 className="heading-1 text-foreground">What Is a Good Internet Speed?</h1>
      <p className="mt-4 text-muted-foreground">
        &quot;Good&quot; depends on how many people share the connection and what they do. Mbps is only
        half the story—ping and jitter matter for real-time apps.
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[540px] text-left text-sm">
          <thead className="bg-muted/60 text-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Use case</th>
              <th className="px-4 py-3 font-semibold">Download</th>
              <th className="px-4 py-3 font-semibold">Upload</th>
              <th className="px-4 py-3 font-semibold">Ping</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.use} className="border-t border-border">
                <td className="px-4 py-3 text-foreground">{r.use}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.down}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.up}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.ping}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-muted-foreground">
        Measure your current connection with our{" "}
        <Link href="/internet-speed-test" className="text-primary hover:underline">
          free speed test
        </Link>
        , then compare against this table.
      </p>
      <AdSlot />
    </article>
  );
}
