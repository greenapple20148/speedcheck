import type { Metadata } from "next";
import Link from "next/link";
import { UnitConverter } from "@/components/calculators/calculators";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mbps to MB/s Converter — Convert Mbps to MB and MB/s",
  description:
    "Convert megabits per second (Mbps) to megabytes per second (MB/s) and mebibytes per second (MiB/s). Learn the 8:1 conversion ratio and calculate real download times.",
  path: "/mbps-to-mbs",
});

const CONVERSION_TABLE = [
  { mbps: "10 Mbps", mbs: "1.25 MB/s", mibs: "1.19 MiB/s", time1Gb: "13m 20s", time10Gb: "2h 13m" },
  { mbps: "25 Mbps", mbs: "3.13 MB/s", mibs: "2.98 MiB/s", time1Gb: "5m 20s", time10Gb: "53m 20s" },
  { mbps: "50 Mbps", mbs: "6.25 MB/s", mibs: "5.96 MiB/s", time1Gb: "2m 40s", time10Gb: "26m 40s" },
  { mbps: "100 Mbps", mbs: "12.50 MB/s", mibs: "11.92 MiB/s", time1Gb: "1m 20s", time10Gb: "13m 20s" },
  { mbps: "250 Mbps", mbs: "31.25 MB/s", mibs: "29.80 MiB/s", time1Gb: "32s", time10Gb: "5m 20s" },
  { mbps: "500 Mbps", mbs: "62.50 MB/s", mibs: "59.60 MiB/s", time1Gb: "16s", time10Gb: "2m 40s" },
  { mbps: "1,000 Mbps (1 Gbps)", mbs: "125.00 MB/s", mibs: "119.21 MiB/s", time1Gb: "8s", time10Gb: "1m 20s" },
  { mbps: "2,000 Mbps (2 Gbps)", mbs: "250.00 MB/s", mibs: "238.42 MiB/s", time1Gb: "4s", time10Gb: "40s" },
];

export default function MbpsPage() {
  return (
    <ToolShell
      title="Mbps to MB/s Converter"
      description="Convert between megabits per second and megabytes per second"
      path="/mbps-to-mbs"
      intro="Internet service providers sell plans in Megabits per second (Mbps), but web browsers, Steam, and file downloads display transfer speeds in Megabytes per second (MB/s). Divide your plan speed by 8 to get your maximum theoretical download speed."
      methodologyHeading="The Math Behind the Conversion"
      methodology="One byte contains 8 bits. To convert Megabits per second (Mbps) to Megabytes per second (MB/s), divide the Mbps value by 8. For binary mebibytes per second (MiB/s, commonly used by Windows and game launchers), multiply bits by 1,000,000 and divide by 8 × 1,048,576 (or divide Mbps by 8.3886). Real-world transfers also lose approximately 3% to 6% of capacity to TCP/IP packet overhead."
      faqs={[
        {
          question: "Why is 100 Mbps not 100 MB/s?",
          answer:
            "Because 'bits' (small 'b') and 'bytes' (capital 'B') are different units of measurement. There are 8 bits in every byte. When your provider advertises 100 Mbps (megabits), your maximum possible download speed is 12.5 MB/s (megabytes per second).",
        },
        {
          question: "What is the formula to convert Mbps to MB/s?",
          answer:
            "Decimal formula: MB/s = Mbps ÷ 8. Binary formula: MiB/s = (Mbps × 1,000,000) ÷ (8 × 1,048,576) ≈ Mbps ÷ 8.3886.",
        },
        {
          question: "How fast is 1 Gbps (gigabit) internet in MB/s?",
          answer:
            "A 1 Gbps (1,000 Mbps) connection provides up to 125 MB/s (decimal) or 119.2 MiB/s (binary). At this speed, an entire 50 GB game download can theoretically finish in under 7 minutes.",
        },
        {
          question: "Why does Steam or my browser show a slower speed than my speed test?",
          answer:
            "Speed tests measure raw network throughput to a nearby server. Game launchers and downloads involve remote server capacity, real-time file decompression on your disk, Wi-Fi interference, and TCP/IP protocol overhead, which typically reduces real-world file speed by 5% to 15%.",
        },
        {
          question: "What is the difference between MB/s and MiB/s?",
          answer:
            "MB/s is based on the metric decimal system (1 MB = 1,000,000 bytes = 10^6). MiB/s (mebibyte per second) is based on the binary system (1 MiB = 1,048,576 bytes = 2^20). Many operating systems like Windows label binary values as 'MB' even though they calculate using mebibytes.",
        },
      ]}
      related={[
        { href: "/download-time-calculator", label: "Download time calculator" },
        { href: "/internet-speed-calculator", label: "Household bandwidth calculator" },
        { href: "/speed-test", label: "Measure your actual speed" },
        { href: "/upload-speed-test", label: "Upload speed test" },
      ]}
    >
      <UnitConverter />

      {/* Quick Conversion Chart */}
      <section className="mt-12" aria-labelledby="conversion-table-heading">
        <h2 id="conversion-table-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Quick Mbps to MB/s Conversion Chart
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Reference table for popular consumer internet broadband speeds, their real transfer rates, and download times.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Plan Speed (Mbps)</th>
                <th className="px-4 py-3">Decimal (MB/s)</th>
                <th className="px-4 py-3">Binary (MiB/s)</th>
                <th className="px-4 py-3">1 GB File Time</th>
                <th className="px-4 py-3">10 GB File Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
              {CONVERSION_TABLE.map((row) => (
                <tr key={row.mbps} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-sans font-medium text-foreground">{row.mbps}</td>
                  <td className="px-4 py-3 text-primary">{row.mbs}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.mibs}</td>
                  <td className="px-4 py-3 text-foreground">{row.time1Gb}</td>
                  <td className="px-4 py-3 text-foreground">{row.time10Gb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Explanatory Guide Content */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Megabits (Mb) vs Megabytes (MB): The 8:1 Ratio
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The fundamental difference between <strong>Mbps</strong> and <strong>MB/s</strong> comes down to the letter case:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Lowercase &ldquo;b&rdquo; (bit):</span>
              A single binary digit (0 or 1). Network communication and internet service providers measure data in bits per second.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Uppercase &ldquo;B&rdquo; (Byte):</span>
              A group of 8 bits representing a character or data chunk. Files, hard drives, and operating systems measure data in bytes.
            </li>
          </ul>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Whenever you see a download progress bar in your browser or gaming console moving at &ldquo;12 MB/s&rdquo;, you are receiving <strong>96 Megabits</strong> of data every second.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Why Real Downloads Feel Slower Than Theoretical Max
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Dividing by 8 gives you your <em>theoretical ceiling</em>, but several real-world factors reduce actual speeds:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Network Protocol Overhead:</span>
              TCP/IP packet headers, handshakes, and encryption eat about 3% to 6% of your usable bandwidth.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. CDN & Server Limits:</span>
              The server sending the file might limit per-client bandwidth or be experiencing high traffic.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. Local Drive & CPU Bottlenecks:</span>
              Many modern installers (like Steam) download compressed data and unpack it on disk concurrently.
            </li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
