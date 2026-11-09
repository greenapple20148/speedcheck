import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Internet Speed Test — Free Broadband Speed Check",
  description:
    "Test your internet speed for download, upload, ping, jitter, and bufferbloat. Accurate, ad-free connection testing against high-performance measurement servers.",
  path: "/internet-speed-test",
});

const SPEED_TIERS = [
  { tier: "50 – 100 Mbps", users: "1 – 2 People", bestFor: "HD/4K video streaming, web browsing, music, casual gaming" },
  { tier: "200 – 400 Mbps", users: "3 – 4 People", bestFor: "Multiple simultaneous Zoom calls, 4K Netflix streams, fast game downloads" },
  { tier: "500 – 1,000 Mbps (Gigabit)", users: "5+ People / Power Users", bestFor: "Heavy work-from-home households, cloud backups, massive game patches" },
  { tier: "2,000+ Mbps (Multi-Gig)", users: "Enthusiasts & Creators", bestFor: "Uncompressed 4K/8K video production, home lab servers, multi-gig LAN networks" },
];

export default function InternetSpeedTestPage() {
  return (
    <ToolShell
      title="Internet Speed Test"
      description="Check download, upload, ping, jitter, and latency under load"
      path="/internet-speed-test"
      intro="Measure your true broadband performance with real multi-connection data transfers. See whether you are receiving the download and upload speeds advertised on your monthly internet bill."
      methodologyHeading="Accurate, Independent Measurement Methodology"
      methodology="Unlike speed tests sponsored by internet service providers, MySpeedGauge uses independent measurement endpoints. Download testing performs concurrent chunked HTTP GET requests to saturate your bandwidth pipe, while upload pushes multi-part data buffers. Throughout both phases, real-time latency probes measure how your ping responds under load (bufferbloat)."
      faqs={[
        {
          question: "How accurate is this internet speed test?",
          answer:
            "This test uses real network transfers against high-capacity edge servers without artificial speed simulation. For the most accurate result, close background downloads and connect your computer directly to your router with an Ethernet cable.",
        },
        {
          question: "What is the difference between download and upload speed?",
          answer:
            "Download speed controls how fast information arrives at your device (loading web pages, streaming movies, downloading games). Upload speed controls how quickly your device sends data out to the internet (webcam video during Zoom calls, sending emails with attachments, cloud file backups).",
        },
        {
          question: "Why does my speed test result change throughout the day?",
          answer:
            "Internet speeds fluctuate based on neighborhood node congestion (especially during evening peak hours between 7 PM and 11 PM on cable internet), household device activity, and Wi-Fi signal interference.",
        },
        {
          question: "What should I do if my speed is far below my plan?",
          answer:
            "First, restart both your modem and Wi-Fi router. Second, test using a wired Ethernet connection to rule out Wi-Fi interference. If speeds remain 30% or more below your advertised tier on Ethernet, contact your ISP customer support with your saved test history as evidence.",
        },
        {
          question: "Does running a speed test consume a lot of mobile data?",
          answer:
            "A standard gigabit speed test can transfer 100 MB to 300 MB of data during a complete run. If you are on a metered cellular hotspot or satellite connection with strict data caps, you can switch to Light Mode in settings to minimize data usage.",
        },
      ]}
      related={[
        { href: "/wifi-speed-test", label: "Wi-Fi speed test" },
        { href: "/upload-speed-test", label: "Upload speed test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/history", label: "Speed test history" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />

      {/* Broadband Speed Guide */}
      <section className="mt-12" aria-labelledby="speed-tiers-heading">
        <h2 id="speed-tiers-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Broadband Speed Tier Reference Guide
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Compare your speed test results against recommended speeds for typical household sizes.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Speed Tier</th>
                <th className="px-4 py-3">Household Size</th>
                <th className="px-4 py-3">Recommended Activities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {SPEED_TIERS.map((tier) => (
                <tr key={tier.tier} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-semibold text-primary">{tier.tier}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{tier.users}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tier.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Metric Breakdown */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Key Metrics Explained
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Download Speed (Mbps):</span>
              Megabits received per second. Higher values mean quicker downloads and seamless 4K/8K video streaming.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Upload Speed (Mbps):</span>
              Megabits sent per second. Dictates video call sharpness and file sharing efficiency.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Ping / Latency (ms):</span>
              Round-trip delay in milliseconds. Crucial for competitive gaming and voice responsiveness.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Bufferbloat (+ms):</span>
              Extra latency added when the connection is busy. Keeps calls and games smooth during downloads.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Best Practices for Accurate Results
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Pause Other Devices:</span>
              Temporarily stop smart TV streaming, video downloads, and cloud syncs on other household devices.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. Close Extra Browser Tabs:</span>
              Resource-intensive web pages and extensions can steal CPU cycles during bandwidth measurement.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. Disconnect VPNs:</span>
              Virtual Private Networks reroute traffic through encrypted servers, artificially capping your measured ISP line speed.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
