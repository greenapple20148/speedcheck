import type { Metadata } from "next";
import { TransferCalculator } from "@/components/calculators/calculators";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Download Time Calculator",
  description:
    "Estimate how long a file takes to download from its size and a megabit rate. Includes decimal and binary units and an optional efficiency factor.",
  path: "/download-time-calculator",
});

export default function DownloadTimePage() {
  return (
    <ToolShell
      title="Download time calculator"
      description="File size and download rate to duration"
      path="/download-time-calculator"
      intro="Time equals file size in bits divided by the rate in bits per second. The result is theoretical. Real transfers lose time to overhead, so you can enter an efficiency below 1."
      methodology="MB and GB use powers of 1,000. MiB and GiB use powers of 1,024. Mbps is always decimal megabits (1,000,000 bits)."
      faqs={[
        {
          question: "Why is my download slower than this?",
          answer:
            "The calculator assumes the rate stays constant. Wi-Fi, a busy line, or a slow server will take longer. Measure the rate with the speed test if you need a real number.",
        },
      ]}
      related={[
        { href: "/upload-time-calculator", label: "Upload time" },
        { href: "/mbps-to-mbs", label: "Mbps to MB/s" },
      ]}
    >
      <TransferCalculator direction="download" />
    </ToolShell>
  );
}
