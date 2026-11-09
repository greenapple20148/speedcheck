import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Upload Speed Test — Test Your Internet Uplink",
  description:
    "Test your upload speed in Mbps. Find out how much upload bandwidth you need for Zoom calls, Twitch streaming, cloud backups, and remote work.",
  path: "/upload-speed-test",
});

const UPLOAD_TIERS = [
  { activity: "1080p HD Video Calling (Zoom, Meet)", minSpeed: "3 – 5 Mbps", recSpeed: "10 Mbps", note: "Prevents screen sharing pixelation and audio cutting." },
  { activity: "Twitch / YouTube 1080p 60fps Livestream", minSpeed: "6 – 8 Mbps", recSpeed: "15 Mbps", note: "Higher bitrate avoids dropped video frames." },
  { activity: "Cloud Backups (iCloud, Google Drive, OneDrive)", minSpeed: "10 Mbps", recSpeed: "25+ Mbps", note: "Upload speed dictates how fast large photo/video libraries sync." },
  { activity: "Online Gaming (Call of Duty, Valorant)", minSpeed: "3 – 5 Mbps", recSpeed: "10 Mbps", note: "Low jitter and steady packet transmission matter more than raw speed." },
  { activity: "4K Video Uploading & Production", minSpeed: "25 Mbps", recSpeed: "50+ Mbps (Fiber)", note: "Symmetrical fiber saves hours when uploading raw video footage." },
];

export default function UploadSpeedTestPage() {
  return (
    <ToolShell
      title="Upload Speed Test"
      description="Measure uplink throughput, latency under load, and connection quality"
      path="/upload-speed-test"
      intro="Your upload speed determines how fast your computer sends data out to the internet. While download speed controls web browsing and video streaming, upload speed is essential for crystal-clear Zoom calls, livestreaming, cloud backups, and responsive online gaming."
      methodologyHeading="How Upload Throughput Is Measured"
      methodology="This test sends multi-stream HTTP POST payloads to our measurement server using realistic chunk sizes. Timing starts immediately following TCP/TLS connection establishment and records the precise byte volume acknowledged by the destination server over time. A simultaneous latency probe runs during the transfer to uncover any upload bufferbloat."
      faqs={[
        {
          question: "What is a good upload speed?",
          answer:
            "For most households, 10 to 20 Mbps is good for multiple video calls and streaming. Power users, content creators, and remote workers who upload large video files or backup photo libraries will benefit from 50 to 500+ Mbps, which is commonly found on symmetrical fiber internet.",
        },
        {
          question: "Why is my upload speed so much lower than my download speed?",
          answer:
            "Most cable (DOCSIS) internet providers use asymmetric connections. Because the average household downloads far more data (streaming movies, browsing) than it sends, ISPs allocate most of the copper coaxial cable frequencies to download channels. Symmetrical fiber (FTTH) providers, by contrast, offer identical upload and download speeds.",
        },
        {
          question: "How much upload speed is needed to work from home?",
          answer:
            "A single person working from home needs at least 5 to 10 Mbps of reliable upload bandwidth. If multiple people in the house are on Zoom or Teams simultaneously, or if automatic cloud backups are running, plan for 25 to 50 Mbps of upload bandwidth to avoid frozen screens.",
        },
        {
          question: "Does upload speed affect online gaming?",
          answer:
            "Yes, but games only need 3 to 5 Mbps of upload to send player coordinates and inputs. What matters most for gaming is upload bufferbloat and jitter: if someone starts a photo backup while you are playing, a saturated upload line will cause massive in-game lag spikes.",
        },
        {
          question: "How can I improve a slow upload speed?",
          answer:
            "Plug into your router with an Ethernet cable, close background cloud backup apps (like Dropbox or Google Drive sync), restart your modem and router, and check whether your plan has a higher upload tier or if fiber is available in your neighborhood.",
        },
      ]}
      related={[
        { href: "/speed-test", label: "Full speed test" },
        { href: "/slow-upload-speed", label: "Slow upload troubleshooting" },
        { href: "/video-call-test", label: "Video call readiness test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />

      {/* Upload Speed Requirements Guide */}
      <section className="mt-12" aria-labelledby="upload-requirements-heading">
        <h2 id="upload-requirements-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Upload Speed Requirements by Activity
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recommended minimum and optimal upload speeds for common household and work-from-home tasks.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Online Activity</th>
                <th className="px-4 py-3">Minimum Uplink</th>
                <th className="px-4 py-3">Recommended</th>
                <th className="px-4 py-3">Why It Matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {UPLOAD_TIERS.map((tier) => (
                <tr key={tier.activity} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{tier.activity}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{tier.minSpeed}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-primary">{tier.recSpeed}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tier.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cable vs Fiber Symmetrical Explanation */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Cable (DOCSIS) vs Fiber: The Upload Asymmetry
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            On coaxial cable networks, downstream and upstream channels share a fixed radio frequency spectrum. Because internet consumption has historically been download-heavy, cable operators typically allocate 85% to 90% of frequencies to downloads.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            As a result, a &ldquo;Gigabit&rdquo; cable plan often provides <strong>1,000 Mbps download</strong> but only <strong>20 to 35 Mbps upload</strong>. Fiber optic networks, by contrast, transmit light over separate channels and routinely offer <strong>symmetrical speeds (1,000 Mbps down AND 1,000 Mbps up)</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Why Saturated Upload Destroys Download Speeds
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Every time your computer downloads a webpage or video file over TCP/IP, it must send tiny acknowledgment packets (ACKs) back to the server saying, &ldquo;I received packet #123, send the next one.&rdquo;
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            If your upload channel is 100% full (e.g. uploading a large smartphone backup), those outgoing ACK packets get trapped in a queue. The remote server pauses its download stream waiting for confirmation, making your entire internet connection feel dead.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
