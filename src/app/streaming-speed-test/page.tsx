import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Streaming Speed Test — Test 4K, HD, & Live Video Readiness",
  description:
    "Test your internet speed for 4K video streaming, Netflix, YouTube, Disney+, and Twitch. Check download throughput, buffering risk, and latency under load.",
  path: "/streaming-speed-test",
});

const STREAMING_PLATFORMS = [
  { platform: "Netflix", sd: "3 Mbps", hd: "5 Mbps", uhd4k: "15 – 25 Mbps", hdr: "Supports Dolby Vision / Atmos" },
  { platform: "YouTube", sd: "2.5 Mbps", hd: "5 Mbps", uhd4k: "20 – 25 Mbps", hdr: "Supports 4K 60fps & AV1 codec" },
  { platform: "Disney+ / Hulu", sd: "3 Mbps", hd: "5 Mbps", uhd4k: "25 Mbps", hdr: "IMAX Enhanced requires 25+ Mbps" },
  { platform: "Apple TV+ / Prime Video", sd: "3 Mbps", hd: "5 Mbps", uhd4k: "25 – 40 Mbps", hdr: "High video bitrate up to 40 Mbps" },
  { platform: "Twitch (Livestreaming)", sd: "2 Mbps (720p)", hd: "6 – 8 Mbps (1080p60)", uhd4k: "N/A", hdr: "Low-latency mode requires steady jitter" },
];

export default function StreamingPage() {
  return (
    <ToolShell
      title="Streaming Speed Test"
      description="Benchmark download bandwidth and buffering risk for 4K, HD, and live streaming"
      path="/streaming-speed-test"
      intro="Streaming video requires sustained download bandwidth and steady packet delivery. Test your connection below to see if your internet can support multiple simultaneous 4K HDR streams without buffering wheels."
      methodologyHeading="How Video Streaming Readiness Is Calculated"
      methodology="Video streams buffer data ahead of playback time. This test measures sustained download throughput across multiple parallel HTTP chunk streams. It also evaluates loaded latency to ensure that background internet activity in your household will not interrupt continuous video buffering."
      faqs={[
        {
          question: "How much internet speed do I need for 4K streaming?",
          answer:
            "A single 4K Ultra HD video stream requires between 15 and 25 Mbps of sustained download bandwidth. If two people are streaming 4K simultaneously in different rooms, you need at least a 50 to 100 Mbps plan to accommodate other household devices.",
        },
        {
          question: "Why does my 4K video buffer on a 200 Mbps connection?",
          answer:
            "Buffering is usually caused by weak Wi-Fi signal between your TV and router, local network congestion (bufferbloat), or the streaming provider's content delivery network (CDN) throttling during prime-time hours, not your overall ISP speed tier.",
        },
        {
          question: "Does live video (Twitch, sports) need more bandwidth than movies?",
          answer:
            "Live video streams have minimal buffer headroom (only 2 to 5 seconds of buffer compared to 30+ seconds for on-demand movies). A momentary Wi-Fi hiccup or latency spike will immediately freeze live sports or Twitch streams.",
        },
        {
          question: "How can I stop my TV or streaming stick from buffering?",
          answer:
            "1. Connect your smart TV or streaming box via an Ethernet cable. 2. If on Wi-Fi, connect to the 5 GHz band rather than 2.4 GHz. 3. Restart your router to clear cached connections. 4. Clear the streaming app cache or reinstall the app.",
        },
      ]}
      related={[
        { href: "/internet-speed-calculator", label: "Household bandwidth planner" },
        { href: "/wifi-speed-test", label: "Wi-Fi speed test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/speed-test", label: "Broadband speed test" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />

      {/* Platform Requirements Table */}
      <section className="mt-12" aria-labelledby="streaming-reqs-heading">
        <h2 id="streaming-reqs-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Streaming Service Bandwidth Requirements
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recommended download speeds per stream across major video platforms.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">SD (480p)</th>
                <th className="px-4 py-3">HD (1080p)</th>
                <th className="px-4 py-3">4K Ultra HD</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {STREAMING_PLATFORMS.map((p) => (
                <tr key={p.platform} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{p.platform}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{p.sd}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{p.hd}</td>
                  <td className="px-4 py-3 font-mono font-medium text-primary">{p.uhd4k}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.hdr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deep Dive */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Modern Video Codecs: AV1, HEVC, and H.264
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Streaming platforms continuously improve data compression to deliver higher visual quality with less bandwidth:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• AV1:</span>
              Open-source, royalty-free next-gen codec used by YouTube and Netflix. Delivers 4K streams at 20% to 30% lower bitrates than HEVC.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• HEVC (H.265):</span>
              Standard codec for 4K HDR and Dolby Vision content on Apple TV and Prime Video.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• H.264 (AVC):</span>
              Legacy codec compatible with every device; requires higher bandwidth for identical visual clarity.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Why TV Wi-Fi Antennas Cause Stuttering
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Smart TVs and plug-in streaming sticks (Roku, Fire Stick) often have tiny, cost-optimized Wi-Fi antennas tucked directly behind the television panel.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The metal backing of the television acts as a radio shield against your router&apos;s Wi-Fi signal. Using an HDMI extender dongle to move the stick out from behind the TV or wiring the TV to an Ethernet port solves most mysterious buffering issues.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
