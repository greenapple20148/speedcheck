import type { Metadata } from "next";
import Link from "next/link";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Online Ping Test — Measure Network Latency & Jitter",
  description:
    "Test your ping and latency in milliseconds. Learn what constitutes a good ping for gaming and video calls, and how to reduce high latency.",
  path: "/ping-test",
});

const PING_BENCHMARKS = [
  { rating: "Elite / Esports", range: "< 20 ms", color: "text-emerald-500", desc: "Virtually instantaneous. Optimal for competitive FPS titles and pro gaming." },
  { rating: "Good", range: "20 – 50 ms", color: "text-teal-500", desc: "Smooth and highly responsive for multiplayer games, video calls, and streaming." },
  { rating: "Fair", range: "50 – 100 ms", color: "text-amber-500", desc: "Fine for regular web browsing and video; minor perceptible delay in fast-paced games." },
  { rating: "Poor / Laggy", range: "> 100 ms", color: "text-rose-500", desc: "Noticeable delay, character teleporting (rubberbanding), and audio desync." },
];

export default function PingTestPage() {
  return (
    <ToolShell
      title="Online Ping Test"
      description="Measure real-time HTTP round-trip latency and stability"
      path="/ping-test"
      intro="Ping measures the time (in milliseconds) it takes for a data packet to travel from your device to an internet server and back. Lower ping means faster responsiveness, lower input delay, and smoother video calls."
      methodologyHeading="How HTTP Latency Is Measured"
      methodology="Web browsers cannot send raw ICMP echo packets due to security sandboxing. This tool measures true application-layer HTTP round-trip latency across 21 consecutive samples. The first warm-up sample is discarded to eliminate connection establishment skew, and the median of remaining samples is calculated alongside jitter and loss."
      faqs={[
        {
          question: "What is a good ping test score?",
          answer:
            "A ping under 20 ms is exceptional. Between 20 ms and 50 ms is great for standard online multiplayer games and video conferences. Anything above 100 ms will introduce noticeable lag, while over 150 ms can make online gaming nearly unplayable.",
        },
        {
          question: "Why is browser ping higher than terminal ICMP ping?",
          answer:
            "The terminal 'ping' command sends lightweight ICMP packets that the operating system kernel handles directly. A browser test measures full HTTP round-trip time, which includes application-layer protocol overhead and browser event loops. It reflects real web application responsiveness.",
        },
        {
          question: "Why is in-game ping different from this test?",
          answer:
            "Each online game connects to its publisher's dedicated regional game servers (often located in different cities or states) over UDP. A speed test measures the path to our nearby diagnostic server. If your diagnostic ping is low but your in-game ping is high, the game server is located far away.",
        },
        {
          question: "What is the fastest way to lower high ping?",
          answer:
            "The single most effective fix is switching from Wi-Fi to a wired Cat6 Ethernet cable. Wi-Fi inherently introduces 5 ms to 25 ms of radio delay and is vulnerable to interference from walls, microwaves, and other devices.",
        },
        {
          question: "Does higher download speed lower my ping?",
          answer:
            "No. Speed (bandwidth) is how much data you can transfer per second; ping (latency) is how fast that data travels. Having a 1,000 Mbps fiber line will not lower your ping if the game server is located 3,000 miles away.",
        },
      ]}
      related={[
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/high-ping-fix", label: "How to fix high ping" },
        { href: "/gaming-speed-test", label: "Gaming speed test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
      ]}
    >
      <HttpProbePanel mode="ping" />

      {/* Latency Benchmarks */}
      <section className="mt-12" aria-labelledby="ping-benchmarks-heading">
        <h2 id="ping-benchmarks-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Ping Latency Quality Benchmarks
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          How different latency ranges impact gaming, VoIP, and web browsing experience.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PING_BENCHMARKS.map((item) => (
            <div key={item.rating} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold uppercase tracking-wider ${item.color}`}>
                  {item.rating}
                </span>
                <span className="font-mono text-base font-bold text-foreground">{item.range}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latency Factors */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            What Determines Your Ping?
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Latency is governed by physics and network architecture:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Physical Distance:</span>
              Light travels through optical fiber at ~200 km per millisecond. A server 2,000 miles away has a physical round-trip baseline of at least 32 ms.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Network Hops & Peering:</span>
              Your data passes through 8 to 15 router hops between your home and destination. Each router adds microsecond queuing delays.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Wi-Fi Radio Overhead:</span>
              Wireless channels require packet contention checks (CSMA/CA), adding variable delays.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Practical Ways to Reduce Ping
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Use an Ethernet Cable:</span>
              Eliminate wireless latency jitter instantly with a direct Cat6 cable connection to your router.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. Select the Closest Server:</span>
              Always select server regions geographically closest to your physical location in games.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. Enable SQM on Your Router:</span>
              If ping spikes when family members use the internet, Smart Queue Management will keep latency flat.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">4. Pause Heavy Background Sync:</span>
              Cloud backups and game patches saturate uplinks, inflating buffer times.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
