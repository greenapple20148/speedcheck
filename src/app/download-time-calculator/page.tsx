import type { Metadata } from "next";
import { HardDrive, ShieldCheck, Zap } from "lucide-react";
import { DownloadHeroArt, DownloadTimeCalculator } from "@/components/calculators/download-time-calculator";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Download Time Calculator",
  description:
    "Estimate how long a file takes to download from its size and a megabit rate. Includes decimal and binary units and an optional efficiency factor.",
  path: "/download-time-calculator",
});

const benefits = [
  { icon: Zap, label: "Quick & Accurate" },
  { icon: ShieldCheck, label: "Real-World Efficiency" },
  { icon: HardDrive, label: "Supports MB, GB & TB" },
];

export default function DownloadTimePage() {
  return (
    <ToolShell
      hideHeader
      title="Download Time Calculator"
      description="File size and download rate to duration"
      path="/download-time-calculator"
      intro="Find out exactly how long your downloads will take based on file size, internet speed, and network efficiency."
      methodologyHeading="How this estimate works"
      methodology="Time in seconds equals the file size in bits divided by the effective speed in bits per second. Effective speed is the entered rate multiplied by the efficiency you choose. MB and GB use powers of 1,000. MiB and GiB use powers of 1,024. Mbps is always decimal megabits (1,000,000 bits). The result is an estimate, not a measurement of a download."
      faqs={[
        {
          question: "Why is my download slower than this?",
          answer:
            "The calculator assumes the rate stays constant. Wi-Fi, a busy line, or a slow server will take longer. Measure the rate with the speed test if you need a real number.",
        },
        {
          question: "What does network efficiency mean?",
          answer:
            "Efficiency is an allowance for overhead. At 90%, the estimate divides the full-speed time by 0.90. It is not a measured loss from your connection.",
        },
        {
          question: "What is the difference between GB and GiB?",
          answer:
            "GB, MB, KB, and TB count by 1,000. GiB, MiB, KiB, and TiB count by 1,024. A 1 GiB file is larger than a 1 GB file, so the estimate is longer.",
        },
      ]}
      related={[
        { href: "/upload-time-calculator", label: "Upload time" },
        { href: "/mbps-to-mbs", label: "Mbps to MB/s" },
        { href: "/speed-test", label: "Speed test" },
      ]}
    >
      <header className="mb-4 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#10231F] sm:text-[2.125rem] [[data-theme=dark]_&]:text-foreground">
            Download Time Calculator
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base [[data-theme=dark]_&]:text-muted-foreground">
            Find out exactly how long your downloads will take based on file size, internet speed, and network efficiency.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {benefits.map((item) => (
              <li key={item.label} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#E7F6F0] px-3 text-xs font-semibold text-[#006B53] [[data-theme=dark]_&]:bg-[var(--bg-tertiary)] [[data-theme=dark]_&]:text-[var(--accent-text)]">
                <item.icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <DownloadHeroArt />
      </header>
      <DownloadTimeCalculator />
    </ToolShell>
  );
}
