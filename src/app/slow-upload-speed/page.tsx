import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Slow Upload Speed — Why It Happens & How to Fix It",
  description:
    "Diagnose and fix slow upload speeds. Learn why cable internet has slow upload, how background cloud backups choke bandwidth, and how to optimize your uplink.",
  path: "/slow-upload-speed",
});

const UPLOAD_BOTTLENECK_CAUSES = [
  { cause: "Cable DOCSIS Architecture", desc: "Cable broadband dedicates up to 90% of coaxial frequencies to download. A 500 Mbps plan often only provides 15–20 Mbps upload by design." },
  { cause: "Silent Cloud Backups", desc: "iCloud Photos, OneDrive, Dropbox, and Google Drive upload automatically in the background, saturating your upload pipe without warning." },
  { cause: "RF Ingress Noise on Coax", desc: "Loose coax connectors, damaged splitters, or corroded outdoor cables let in radio interference that degrades upstream power levels." },
  { cause: "Wi-Fi Device Upload Power", desc: "Smartphones and laptops have small, battery-conserving Wi-Fi antennas that transmit back to the router with much less power than the router broadcasts." },
];

export default function SlowUploadPage() {
  return (
    <ToolShell
      title="Slow Upload Speed Troubleshooting"
      description="Measure uplink performance and isolate why uploads are lagging"
      path="/slow-upload-speed"
      intro="If your video calls are freezing, file uploads take hours, or gaming ping spikes whenever someone uses the internet, your upload bandwidth is likely saturated or restricted by your provider."
      methodologyHeading="How to Test and Verify Your Uplink"
      methodology="Run the speed test below to measure your actual upload throughput in Mbps. Compare your result with the upload speed specified on your internet bill. If your upload speed is less than 70% of your plan on a wired Ethernet connection, your line is underperforming."
      faqs={[
        {
          question: "Why is my upload speed so much slower than my download speed?",
          answer:
            "On cable internet (Spectrum, Xfinity, Cox), upload is asymmetric by design. Providers prioritize download bandwidth for streaming movies and browsing. To get identical upload and download speeds (e.g. 500 Mbps down AND 500 Mbps up), you need symmetrical fiber internet (such as AT&T Fiber, Verizon Fios, or Google Fiber).",
        },
        {
          question: "Can slow upload speed cause high ping in online games?",
          answer:
            "Yes! Every online game sends player coordinates and inputs over your upload channel. If an iPhone starts backing up photos to iCloud, your entire upload pipe saturates, creating severe bufferbloat that drives your in-game ping from 20 ms to 300+ ms.",
        },
        {
          question: "How much upload speed do I need for Zoom or Teams?",
          answer:
            "A single 1080p video call needs 3 to 5 Mbps of consistent upload bandwidth. If two or more people are on video meetings simultaneously while cloud syncing is active, you need at least 15 to 25 Mbps of upload capacity.",
        },
        {
          question: "How do I fix a slow upload speed?",
          answer:
            "1. Connect with an Ethernet cable. 2. Pause cloud backup applications during work hours. 3. Tighten all coaxial cable connections and remove unnecessary splitters. 4. Restart your modem to renegotiate upstream channels. 5. If available, switch to a fiber optic internet plan.",
        },
      ]}
      related={[
        { href: "/upload-speed-test", label: "Upload speed test" },
        { href: "/video-call-test", label: "Video call test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/speed-test", label: "Broadband speed test" },
      ]}
    >
      <SpeedTestDashboard />

      {/* Common Bottlenecks */}
      <section className="mt-12" aria-labelledby="bottlenecks-heading">
        <h2 id="bottlenecks-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Top 4 Causes of Slow Upload Speeds
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Understanding the hardware, architectural, and software reasons behind sluggish upload rates.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {UPLOAD_BOTTLENECK_CAUSES.map((item) => (
            <div key={item.cause} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">{item.cause}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Guide Content */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            How to Schedule Silent Background Uploads
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cloud storage providers are designed to consume 100% of available upload capacity the second new photos or files are detected:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Dropbox & OneDrive:</span>
              Open Preferences $\rightarrow$ Network / Bandwidth, and set an upload speed limit (e.g., 50% of your maximum line rate).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Google Drive / Photos:</span>
              Schedule large folder syncs overnight when household internet usage is minimal.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Apple iCloud Backup:</span>
              iCloud automatically pauses backups if your device is actively in use or on cellular data.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            When to Contact Your ISP About Upstream Issues
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If you pay for 35 Mbps upload but only measure 2 to 5 Mbps on a wired connection directly into your modem:
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1.</span>
              Log into your cable modem admin page (usually 192.168.100.1).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2.</span>
              Check the &ldquo;Upstream Power Level&rdquo; (normal range is 38 to 48 dBmV). Above 50 dBmV means your modem is struggling to push signal through physical noise.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3.</span>
              Call support and request an upstream signal diagnostic test from their dispatch center.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
