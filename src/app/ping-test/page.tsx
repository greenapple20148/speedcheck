import type { Metadata } from "next";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Online Ping Test — Measure Latency & Jitter",
  description:
    "Measure HTTP round-trip time and jitter to the configured endpoint. Results are labeled as application latency, not ICMP ping.",
  path: "/ping-test",
});

export default function PingTestPage() {
  return (
    <ToolShell
      title="Ping test"
      description="HTTP latency and jitter"
      path="/ping-test"
      intro="This probe sends repeated HTTP requests to the measurement endpoint. It does not send ICMP echo requests, and it does not contact game servers."
      methodology="The test takes 21 samples and drops the first. The figure shown is the median of the rest. Jitter is the mean absolute difference between successive valid samples. Failed requests are counted separately."
      faqs={[
        {
          question: "Is this the same as the ping command?",
          answer:
            "No. A browser cannot send ICMP. This is application-level round-trip time and is usually higher than an ICMP ping on the same path.",
        },
      ]}
      related={[
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/high-ping-fix", label: "High latency checks" },
      ]}
    >
      <HttpProbePanel mode="ping" />
    </ToolShell>
  );
}
