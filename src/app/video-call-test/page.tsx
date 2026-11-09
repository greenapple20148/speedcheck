import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Video Call Test — Check Zoom, Teams, Meet & FaceTime Readiness",
  description:
    "Test your internet connection for video conferencing. Check upload speed, jitter, and latency stability for Zoom, Microsoft Teams, and Google Meet.",
  path: "/video-call-test",
});

const VIDEO_PLATFORMS = [
  { app: "Zoom (1-on-1 HD)", download: "3.8 Mbps", upload: "3.0 Mbps", targetPing: "< 50 ms", note: "1080p HD video with standard audio" },
  { app: "Zoom (Group Video)", download: "4.0 Mbps", upload: "3.8 Mbps", targetPing: "< 50 ms", note: "Multiple webcam feeds active simultaneously" },
  { app: "Microsoft Teams", download: "4.0 Mbps", upload: "4.0 Mbps", targetPing: "< 60 ms", note: "Includes simultaneous screen sharing & background blur" },
  { app: "Google Meet", download: "3.2 Mbps", upload: "3.2 Mbps", targetPing: "< 50 ms", note: "WebRTC peer-to-peer or server media bridge" },
  { app: "Apple FaceTime HD", download: "3.0 Mbps", upload: "3.0 Mbps", targetPing: "< 40 ms", note: "Optimized for Apple devices and low latency" },
  { app: "Discord Voice & Video", download: "2.5 Mbps", upload: "2.5 Mbps", targetPing: "< 30 ms", note: "High-fidelity Opus audio codec + 1080p stream" },
];

export default function VideoCallPage() {
  return (
    <ToolShell
      title="Video Call Readiness Test"
      description="Evaluate upload bandwidth, jitter, and loaded latency for video meetings"
      path="/video-call-test"
      intro="Video conferencing requires symmetrical stability: smooth incoming video and reliable outgoing webcam audio. Test your connection below to see if your internet is ready for professional Zoom, Teams, and Google Meet calls."
      methodologyHeading="How Video Call Readiness Is Evaluated"
      methodology="Real-time WebRTC audio and video require constant packet pacing. This test evaluates upload throughput, download throughput, idle HTTP latency, jitter, and bufferbloat under load. If upload latency spikes significantly when data transfers occur, you will likely experience frozen video frames and robotic audio during group calls."
      faqs={[
        {
          question: "Why do my video calls freeze even though my internet is fast?",
          answer:
            "Most home broadband plans offer fast download (e.g. 300 Mbps) but restricted upload (e.g. 10 Mbps). If someone else in the house uploads photos or a phone begins an automatic cloud backup, your upload line saturates, causing severe jitter and packet drops that freeze your video feed.",
        },
        {
          question: "What causes 'Your internet connection is unstable' warnings in Zoom?",
          answer:
            "Zoom displays this warning when it detects high packet loss (greater than 2%) or erratic jitter (greater than 20 ms). It indicates that the connection between your laptop and Zoom's media servers is dropping frames or encountering latency spikes.",
        },
        {
          question: "How can I improve my connection for work-from-home video calls?",
          answer:
            "1. Connect with an Ethernet cable instead of Wi-Fi. 2. Move closer to your Wi-Fi router and connect to the 5 GHz band. 3. Turn off bandwidth-hungry background apps like Dropbox or OneDrive syncing. 4. If your router supports it, enable QoS (Quality of Service) to prioritize video call packets.",
        },
        {
          question: "Does screen sharing require more bandwidth than webcam video?",
          answer:
            "Screen sharing itself requires relatively low bandwidth (1.5 to 3 Mbps) for static documents. However, sharing full-motion video clips over screen share can push upload requirements to 5+ Mbps and requires rock-solid latency.",
        },
      ]}
      related={[
        { href: "/upload-speed-test", label: "Upload speed test" },
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/slow-upload-speed", label: "Slow upload fixes" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />

      {/* Platform Requirements Table */}
      <section className="mt-12" aria-labelledby="platforms-reqs-heading">
        <h2 id="platforms-reqs-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Video Conferencing Bandwidth Requirements
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recommended minimum bandwidth and latency thresholds across popular business and personal calling apps.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Rec. Download</th>
                <th className="px-4 py-3">Rec. Upload</th>
                <th className="px-4 py-3">Target Ping</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {VIDEO_PLATFORMS.map((p) => (
                <tr key={p.app} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{p.app}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{p.download}</td>
                  <td className="px-4 py-3 font-mono font-medium text-primary">{p.upload}</td>
                  <td className="px-4 py-3 font-mono text-emerald-500">{p.targetPing}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Guide Content */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Why Upload Stability Matters More Than Download
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            When you watch a video on YouTube, your computer has dozens of seconds of buffer room. In a live video conference, there is zero buffer: every syllable you speak must arrive within 150 milliseconds.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            If your upload bandwidth is choked by background photo backups, your outgoing audio packets are delayed or dropped. Your meeting colleagues will hear robotic, chopped speech while your incoming video might still look completely fine.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Quick Fixes Before an Important Meeting
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Plug In:</span>
              Use an Ethernet cable or move within direct line of sight of your Wi-Fi router.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. Pause Cloud Sync:</span>
              Temporarily pause Dropbox, OneDrive, or Google Drive for 1 hour.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. Lower Camera Resolution:</span>
              Switching from 1080p to 720p inside Zoom settings cuts required upload bandwidth by 50%.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
