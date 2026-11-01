import type { Metadata } from "next";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Wi-Fi vs Ethernet — Which Path Is Slower?",
  description:
    "Run the same speed test on a cable and on Wi-Fi. The gap is the wireless hop, not a guess about your ISP.",
  path: "/wifi-vs-ethernet",
});

export default function WifiVsEthernetPage() {
  return (
    <ToolShell
      title="Wi-Fi vs Ethernet"
      description="Compare wireless and wired results"
      path="/wifi-vs-ethernet"
      intro="Ethernet shows the path through the router to the measurement endpoint. Wi-Fi adds distance, interference, and the radio. Run this test once each way and save both before you buy anything."
      methodology="Use the same mode and the same endpoint. Tag the saved result as wired or Wi-Fi on the result panel. A large gap means the wireless hop is part of the difference. A small gap means the limit is elsewhere."
      faqs={[
        {
          question: "Is Ethernet always faster?",
          answer:
            "Not always. A damaged cable or a slow port can lose to a nearby Wi-Fi 6 radio. Measure both instead of assuming.",
        },
      ]}
      related={[
        { href: "/guides/how-to-improve-wifi-speed", label: "Improve Wi-Fi" },
        { href: "/history", label: "Saved results" },
      ]}
    >
      <SpeedTestDashboard />
    </ToolShell>
  );
}
