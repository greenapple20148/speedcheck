import type { Metadata } from "next";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Connection Stability Test — Latency Over Time",
  description:
    "Run a 30-second, 60-second, or 5-minute HTTP latency check. The test stops when you cancel or leave the page.",
  path: "/connection-stability-test",
});

export default function StabilityPage() {
  return (
    <ToolShell
      title="Connection stability test"
      description="HTTP latency over a chosen duration"
      path="/connection-stability-test"
      intro="Pick a duration and watch HTTP round-trip time. The test does not continue in the background after you leave or press Cancel."
      methodology="One request is sent about once per second until the selected duration ends. The summary shows median, p95, jitter, and the share of failed requests."
      faqs={[
        {
          question: "Will this run all day?",
          answer: "No. The longest option is five minutes, and it stops when you cancel or navigate away.",
        },
      ]}
      related={[
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/guides/what-is-latency", label: "What is latency?" },
      ]}
    >
      <HttpProbePanel mode="stability" />
    </ToolShell>
  );
}
