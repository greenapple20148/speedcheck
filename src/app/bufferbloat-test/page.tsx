import type { Metadata } from "next";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Bufferbloat Test — Check Latency Under Load",
  description:
    "Compare idle HTTP latency with latency during a download and an upload. See the increase and what to try next.",
  path: "/bufferbloat-test",
});

export default function BufferbloatPage() {
  return (
    <ToolShell
      title="Bufferbloat test"
      description="Latency under download and upload load"
      path="/bufferbloat-test"
      intro="Bufferbloat is extra delay that shows up when a link is full. This page runs a standard test so latency probes continue during the transfers."
      methodology="Idle latency is the median of HTTP round trips before the transfer. Loaded latency is the median of probes taken about every 200 ms during download and again during upload. The increase is loaded minus idle. Letter grades use this site's documented thresholds and are not an industry certification."
      faqs={[
        {
          question: "Can a fast speed test still have bufferbloat?",
          answer:
            "Yes. Throughput can look fine while latency climbs as soon as a download or upload fills the queue.",
        },
        {
          question: "What should I try if latency rises under load?",
          answer:
            "Pause other transfers, enable SQM or QoS if the router offers it, and compare a wired retest. Change one thing at a time.",
        },
      ]}
      related={[
        { href: "/guides/what-is-bufferbloat", label: "What is bufferbloat?" },
        { href: "/internet-troubleshooter", label: "Troubleshooter" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" showModeToggle={false} />
    </ToolShell>
  );
}
