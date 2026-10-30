import type { Metadata } from "next";
import { ToolPage } from "@/components/seo/tool-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Ping Test",
  description:
    "Measure ping (latency) to see how responsive your connection is for gaming and video calls.",
  path: "/ping-test",
});

export default function PingTestPage() {
  return (
    <ToolPage
      title="Ping Test"
      description="Ping / latency test"
      path="/ping-test"
      intro="Ping is the round-trip time between your device and the test server. Lower is better—especially for competitive gaming."
      bullets={[
        "Under 30 ms is excellent for most online games",
        "30–60 ms is typically fine for casual play and calls",
        "Wi‑Fi interference can inflate ping even when Mbps looks fine",
      ]}
      defaultMode="lightweight"
      related={[
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/internet-speed-test", label: "Full speed test" },
      ]}
    />
  );
}
