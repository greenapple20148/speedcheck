import type { Metadata } from "next";
import Link from "next/link";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Jitter Test — Measure Ping & Latency Variation Online",
  description:
    "Test your connection jitter and ping consistency in milliseconds. Learn what causes high jitter in gaming and video calls, and how to stabilize your network.",
  path: "/jitter-test",
});

const JITTER_THRESHOLDS = [
  { rating: "Excellent", range: "< 5 ms", status: "text-emerald-500", desc: "Optimal for competitive esports, real-time audio, and crystal-clear VoIP calls." },
  { rating: "Good", range: "5 – 15 ms", status: "text-teal-500", desc: "Smooth experience for regular online gaming, Zoom/Teams calls, and 4K streaming." },
  { rating: "Fair", range: "15 – 30 ms", status: "text-amber-500", desc: "Minor audio robotic stutter and occasional input micro-stutter in fast-paced games." },
  { rating: "Poor", range: "> 30 ms", status: "text-rose-500", desc: "Frequent rubberbanding, audio dropouts, and desynchronization in real-time apps." },
];

export default function JitterTestPage() {
  return (
    <ToolShell
      title="Jitter Test"
      description="Measure latency stability and round-trip variation"
      path="/jitter-test"
      intro="Jitter measures how much your connection latency fluctuates over time. While ping tells you how fast packets travel, jitter tells you how steady that journey is. Steady latency ensures smooth gaming and uninterrupted video calls."
      methodologyHeading="How Jitter Is Calculated"
      methodology="This diagnostic probe sends rapid successive HTTP requests to the measurement endpoint. After dropping the initial TCP handshake warm-up sample, jitter is computed as the mean absolute deviation between consecutive round-trip times. Consistent intervals yield near-zero jitter, whereas erratic intervals indicate packet buffering or transmission delays."
      faqs={[
        {
          question: "What is a good jitter score?",
          answer:
            "Under 5 ms is considered excellent. Between 5 ms and 15 ms is good and will work smoothly for gaming and video conferencing. Once jitter climbs above 30 ms, you will likely notice lag spikes, teleporting characters, and robotic voices.",
        },
        {
          question: "Can I have low ping but high jitter?",
          answer:
            "Yes! Your average ping might be 25 ms, but if individual packets swing between 10 ms and 120 ms, your connection will feel laggy and stuttery. Real-time apps depend on predictability more than raw speed.",
        },
        {
          question: "Why does jitter hurt gaming and VoIP more than web browsing?",
          answer:
            "Websites and video streams can buffer seconds or minutes of data in advance. Real-time games and voice calls cannot buffer—they must deliver packets within tens of milliseconds. When jitter causes packets to arrive out of order or late, they are dropped.",
        },
        {
          question: "What is the primary cause of network jitter?",
          answer:
            "The top three causes are Wi-Fi interference, network congestion (bufferbloat caused by household downloads), and ISP routing changes. Switching to a wired Ethernet cable is the fastest single fix for Wi-Fi jitter.",
        },
        {
          question: "How do I fix high jitter on my home Wi-Fi?",
          answer:
            "Connect via Cat6 Ethernet if possible. If on Wi-Fi, switch from the 2.4 GHz band to 5 GHz or 6 GHz to reduce radio interference, enable SQM (Smart Queue Management) on your router, and pause heavy cloud backups during calls.",
        },
      ]}
      related={[
        { href: "/ping-test", label: "Ping test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/connection-stability-test", label: "Stability test" },
        { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet comparison" },
      ]}
    >
      <HttpProbePanel mode="jitter" />

      {/* Jitter Quality Benchmarks */}
      <section className="mt-12" aria-labelledby="jitter-benchmarks-heading">
        <h2 id="jitter-benchmarks-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Network Jitter Quality Benchmarks
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use these industry reference standards to evaluate how your jitter score impacts real-time applications.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {JITTER_THRESHOLDS.map((tier) => (
            <div key={tier.rating} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold uppercase tracking-wider ${tier.status}`}>
                  {tier.rating}
                </span>
                <span className="font-mono text-base font-bold text-foreground">{tier.range}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{tier.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deep Dive Guide */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Ping vs Jitter: Why Consistency Trumps Speed
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Imagine driving on a highway where your average speed is 60 mph. If you cruise at a steady 60 mph, the ride is effortless. But if you alternate every two seconds between 10 mph and 110 mph, you will experience severe whiplash.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            That is what jitter does to your internet connection. A stable <strong>50 ms ping</strong> delivers a far smoother gaming and calling experience than an erratic connection oscillating between <strong>15 ms and 180 ms</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Top 4 Steps to Eliminate Network Jitter
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Plug into Ethernet:</span>
              Radio wave interference from walls, microwaves, and neighboring routers is the #1 culprit for erratic packet delivery.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. Enable SQM (Smart Queue Management):</span>
              Routers with SQM (like CAKE or fq_codel) prevent household downloads from choking real-time packets. Run our{" "}
              <Link href="/bufferbloat-test" className="text-primary hover:underline">
                bufferbloat test
              </Link>{" "}
              to check.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. Upgrade to 5 GHz or 6 GHz:</span>
              The 2.4 GHz band is overcrowded with Bluetooth, baby monitors, and smart plugs.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">4. Update Network Drivers:</span>
              Outdated Wi-Fi card drivers often throttle packet transmission when power management modes trigger.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
