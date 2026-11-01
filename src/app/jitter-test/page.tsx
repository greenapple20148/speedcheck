import type { Metadata } from "next";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Jitter Test — Measure Latency Variation",
  description:
    "See how much HTTP round-trip time changes from sample to sample. High jitter is reported separately from the median.",
  path: "/jitter-test",
});

export default function JitterTestPage() {
  return (
    <ToolShell
      title="Jitter test"
      description="Variation between HTTP latency samples"
      path="/jitter-test"
      intro="Jitter here is the average gap between successive HTTP round trips. A steady 40 ms is different from a connection that swings between 20 ms and 90 ms."
      methodology="Samples are HTTP requests to one endpoint. The first sample is dropped. Jitter uses only successful samples, in order."
      faqs={[
        {
          question: "Can jitter be high when the average looks fine?",
          answer:
            "Yes. Calls and games react to the swings. Read the jitter figure next to the median, not instead of it.",
        },
      ]}
      related={[
        { href: "/ping-test", label: "Ping test" },
        { href: "/connection-stability-test", label: "Stability test" },
      ]}
    >
      <HttpProbePanel mode="jitter" />
    </ToolShell>
  );
}
