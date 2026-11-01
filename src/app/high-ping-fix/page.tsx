import type { Metadata } from "next";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "High Ping — Measure Latency and What to Retest",
  description:
    "Measure HTTP latency, then retest on Ethernet and with other downloads paused. This is not in-game ping.",
  path: "/high-ping-fix",
});

export default function HighPingPage() {
  return (
    <ToolShell
      title="High latency checks"
      description="HTTP latency and a short retest plan"
      path="/high-ping-fix"
      intro="Start with a measurement. If idle HTTP latency is high on Ethernet, the path beyond your Wi-Fi is involved. If it drops on a cable, the wireless hop was adding delay. Neither result is the ping shown inside a game."
      methodology="Use the probe below for idle latency and jitter. If games only lag while someone is downloading, run the bufferbloat test next. That separates a high idle delay from delay that appears under load."
      faqs={[
        {
          question: "What is a useful retest?",
          answer:
            "Change one thing: cable instead of Wi-Fi, or pause a backup. Run the same probe again and compare the median.",
        },
      ]}
      related={[
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/guides/how-to-reduce-ping-while-gaming", label: "Reduce latency for games" },
      ]}
    >
      <HttpProbePanel mode="ping" />
    </ToolShell>
  );
}
