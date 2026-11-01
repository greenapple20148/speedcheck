import type { Metadata } from "next";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Application Request Loss Test",
  description:
    "Count HTTP requests that fail to the measurement endpoint. This is not ICMP or UDP packet loss.",
  path: "/packet-loss-test",
});

export default function PacketLossPage() {
  return (
    <ToolShell
      title="Application-level request loss"
      description="HTTP request failure rate"
      path="/packet-loss-test"
      intro="A browser cannot measure universal ICMP or UDP packet loss. This test reports how many HTTP requests to the measurement endpoint fail. If that endpoint is not configured, the page stays empty instead of inventing a percentage."
      methodology="Thirty GET requests are sent one at a time. A non-OK response or a network error counts as a failed request. The percentage is failed divided by attempted."
      faqs={[
        {
          question: "Does 0% mean the network never drops packets?",
          answer:
            "No. It means these HTTP requests succeeded. Packet loss on other protocols can still exist.",
        },
      ]}
      related={[
        { href: "/connection-stability-test", label: "Stability test" },
        { href: "/ping-test", label: "Ping test" },
      ]}
    >
      <HttpProbePanel mode="loss" />
    </ToolShell>
  );
}
