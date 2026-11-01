import type { Metadata } from "next";
import { TransferCalculator } from "@/components/calculators/calculators";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Upload Time Calculator",
  description:
    "Estimate upload duration from file size and upload megabits per second, with decimal and binary size units.",
  path: "/upload-time-calculator",
});

export default function UploadTimePage() {
  return (
    <ToolShell
      title="Upload time calculator"
      description="File size and upload rate to duration"
      path="/upload-time-calculator"
      intro="Use your upload rate, not the download number on the plan. The formula is the same as the download calculator: bits divided by bits per second."
      methodology="No request leaves this page. Efficiency is optional and simply divides the theoretical time."
      faqs={[
        {
          question: "Which rate should I type?",
          answer: "Use a measured upload Mbps from a speed test, or the upload speed written on your plan.",
        },
      ]}
      related={[
        { href: "/slow-upload-speed", label: "Measure upload" },
        { href: "/download-time-calculator", label: "Download time" },
      ]}
    >
      <TransferCalculator direction="upload" />
    </ToolShell>
  );
}
