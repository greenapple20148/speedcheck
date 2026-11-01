import type { Metadata } from "next";
import { BandwidthEstimator } from "@/components/calculators/bandwidth/bandwidth-estimator";
import { EstimatorGuide } from "@/components/calculators/bandwidth/estimator-guide";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Internet Speed Calculator — Household Bandwidth",
  description:
    "Add up planning bandwidth for streams, calls, and backups. This estimate does not measure your connection.",
  path: "/internet-speed-calculator",
});

export default function SpeedCalculatorPage() {
  return (
    <ToolShell
      title="Bandwidth Usage Estimator"
      description="Add up planning bandwidth for streams, calls, and backups. This estimate does not measure your connection."
      path="/internet-speed-calculator"
      hideHeader
      wide
      intro="Find out how much internet speed your household really needs."
      methodologyHeading="How this estimate is calculated"
      methodology="Each activity has a fixed reference rate for download and upload. The estimator multiplies that rate by the quantity you set and adds the activities together. Utilization is that total divided by the plan speed you enter. Recommended capacity is the total plus 25% headroom, rounded up to a common plan size. None of these figures is a reading from your modem."
      faqs={[
        {
          question: "Does a high percentage mean the plan is too small?",
          answer:
            "It means the activities you listed can fill that share of the plan if they all run at once. Above 100% means the listed load is larger than the plan speed you entered. Measure the connection before you change plans.",
        },
        {
          question: "Is this the same as a speed test?",
          answer:
            "No. The estimator does not contact your modem or provider. A speed test measures throughput. The numbers here are planning assumptions you can edit.",
        },
        {
          question: "Why can upload fill up before download?",
          answer:
            "Video calls and cloud backup need upload. Many home plans offer much less upload than download, so the upload bar can turn amber or red while download still looks comfortable.",
        },
      ]}
      related={[
        { href: "/streaming-speed-test", label: "Streaming test" },
        { href: "/speed-test", label: "Measure your line" },
        { href: "/wifi-speed-test", label: "Wi-Fi speed test" },
      ]}
    >
      <BandwidthEstimator />
      <EstimatorGuide />
    </ToolShell>
  );
}
