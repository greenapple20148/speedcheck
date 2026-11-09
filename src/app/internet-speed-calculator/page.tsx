import type { Metadata } from "next";
import { BandwidthEstimator } from "@/components/calculators/bandwidth/bandwidth-estimator";
import { EstimatorGuide } from "@/components/calculators/bandwidth/estimator-guide";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Internet Speed Calculator for Gaming, Streaming & Households",
  description:
    "Calculate how much download and upload speed (Mbps) your household needs for simultaneous 4K streaming, multiplayer gaming, video calls, and remote work.",
  path: "/internet-speed-calculator",
});

export default function SpeedCalculatorPage() {
  return (
    <ToolShell
      title="Household Bandwidth & Speed Calculator"
      description="Add up planning bandwidth for streams, gaming, calls, and smart devices"
      path="/internet-speed-calculator"
      hideHeader
      wide
      intro="Find out how much internet speed your household really needs for smooth 4K streaming, lag-free gaming, and remote work."
      methodologyHeading="How this estimate is calculated"
      methodology="Each activity uses an established reference rate for download and upload. The estimator multiplies each rate by the number of active users or devices and sums them together. Utilization represents that total divided by your entered plan speed. Recommended bandwidth includes a 25% safety headroom cushion, rounded up to standard broadband tier plans."
      faqs={[
        {
          question: "How much internet speed do I need for gaming and streaming at the same time?",
          answer:
            "Gaming only requires 5 to 10 Mbps of download bandwidth, while a 4K video stream requires about 25 Mbps. If one person is gaming while two others stream in 4K, a 100 to 200 Mbps plan provides plenty of headroom without causing latency spikes.",
        },
        {
          question: "What internet speed is recommended for a household of 4 or 5 people?",
          answer:
            "For a family of 4 to 5 with multiple smartphones, smart TVs, laptops, and game consoles, a 300 to 500 Mbps plan is ideal. If multiple family members work from home or participate in simultaneous video conferences, consider a symmetrical fiber plan with 500 Mbps or 1 Gbps.",
        },
        {
          question: "Why do games lag even when I have a 500 Mbps plan?",
          answer:
            "Online gaming depends on ping (latency) and jitter, not high bandwidth. If your network suffers from bufferbloat (lag under load) or Wi-Fi interference, your ping will spike even on a gigabit connection. Run our Bufferbloat Test to check your latency under load.",
        },
        {
          question: "Does a high percentage mean my plan is too small?",
          answer:
            "It means the activities you listed can fill that share of the plan if they all run at once. Above 100% means the listed simultaneous load is larger than the plan speed you entered. Measure your actual connection with our speed test before upgrading.",
        },
        {
          question: "Why can upload fill up before download?",
          answer:
            "Video calls, cloud backups, and smart security cameras constantly use upload bandwidth. Many home cable plans offer 100–500 Mbps download but only 10–20 Mbps upload, causing the upload pipe to saturate much faster than download.",
        },
      ]}
      related={[
        { href: "/gaming-speed-test", label: "Gaming speed test" },
        { href: "/streaming-speed-test", label: "Streaming test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/speed-test", label: "Measure your actual speed" },
      ]}
    >
      <BandwidthEstimator />
      <EstimatorGuide />
    </ToolShell>
  );
}
