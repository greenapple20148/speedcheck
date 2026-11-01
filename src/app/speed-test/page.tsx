import type { Metadata } from "next";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Internet Speed Test — Check Download, Upload & Ping",
  description:
    "Run a real download and upload test. See idle HTTP latency, jitter, and latency under load from one measurement endpoint.",
  path: "/speed-test",
});

export default function SpeedTestPage() {
  return (
    <ToolShell
      title="Internet speed test"
      description="Download, upload, and HTTP latency test"
      path="/speed-test"
      intro="This test moves real data to the configured measurement service. Empty dashes stay empty until a run finishes. Nothing here is a simulated speed."
      methodology="Download timing starts at the first response byte after a small warm-up transfer that is not counted. Upload timing includes connection setup and uses the byte count the server reports. Latency is HTTP round-trip time, not ICMP."
      faqs={[
        {
          question: "Why might this differ from another speed test?",
          answer:
            "The server, the number of connections, the time limit, and your Wi-Fi all change the result. Compare tests that name their endpoint and method.",
        },
        {
          question: "Does the test start by itself?",
          answer: "No. A run starts only when you press the button, and you can cancel it.",
        },
      ]}
      related={[
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/ping-test", label: "Ping test" },
        { href: "/methodology", label: "Methodology" },
      ]}
    >
      <SpeedTestDashboard />
    </ToolShell>
  );
}
