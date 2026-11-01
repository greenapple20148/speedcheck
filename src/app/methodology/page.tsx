import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BUFFERBLOAT_GRADE_NOTE, THROUGHPUT_TIMING_NOTES } from "@/lib/network/methodology";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Measurement Methodology",
  description:
    "How MySpeedGauge times downloads, uploads, HTTP latency, jitter, and latency under load, and what it does not claim.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Methodology" }]} />
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">How measurements work</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        Every figure comes from the configured measurement service. If that service is off, the test shows an error. It does not substitute a guess.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Download</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {THROUGHPUT_TIMING_NOTES.download.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Upload</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {THROUGHPUT_TIMING_NOTES.upload.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Latency</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {THROUGHPUT_TIMING_NOTES.latency.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Bufferbloat grades</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{BUFFERBLOAT_GRADE_NOTE}</p>
      <h2 className="mt-8 text-xl font-semibold">What this site does not measure</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        ICMP ping, UDP packet loss, and latency to a game publisher are not available from a normal browser. Request-failure tests are labeled as application-level request loss. DNS time is shown only when Resource Timing exposes a real lookup.
      </p>
    </article>
  );
}
