import type { Metadata } from "next";
import Link from "next/link";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Connection Stability Test — Test Network Reliability Over Time",
  description:
    "Test your internet connection stability over 30 seconds, 60 seconds, or 5 minutes. Detect micro-disconnects, latency spikes, and Wi-Fi signal drops.",
  path: "/connection-stability-test",
});

const STABILITY_INTERVALS = [
  { duration: "30 Seconds", useCase: "Quick Health Check", desc: "Fast baseline to verify current Wi-Fi responsiveness and basic line quality." },
  { duration: "60 Seconds", useCase: "Standard Diagnostics", desc: "Ideal for spotting intermittent bufferbloat and periodic packet loss bursts." },
  { duration: "5 Minutes", useCase: "Deep Stress Test", desc: "Reveals thermal throttling, ISP routing shifts, and intermittent micro-drops." },
];

export default function StabilityPage() {
  return (
    <ToolShell
      title="Connection Stability Test"
      description="Monitor latency variance and packet drops continuously over time"
      path="/connection-stability-test"
      intro="A standard speed test only takes 10 seconds, which can easily miss intermittent lag spikes and micro-disconnects. This stability test streams continuous requests for up to 5 minutes so you can monitor real-time network consistency."
      methodologyHeading="How Stability Is Evaluated"
      methodology="The probe continuously dispatches HTTP requests at 1-second intervals for your chosen duration. Each response timestamp is recorded to track median latency, 95th percentile (p95) latency, standard deviation, and failed request percentage. The test stops immediately when completed or if manually canceled."
      faqs={[
        {
          question: "Why does connection stability matter more than peak download speed?",
          answer:
            "A connection that boasts 1,000 Mbps download but drops packets every 45 seconds will constantly freeze your Zoom calls, kick you out of gaming matches, and disconnect remote desktop (RDP/SSH) sessions. Stability and low variance are the true marks of high-quality broadband.",
        },
        {
          question: "What is p95 latency and why should I care?",
          answer:
            "Median (50th percentile) latency tells you how fast the typical packet travels. p95 latency tells you the speed of the slowest 5% of packets. A wide gap between median and p95 indicates frequent lag spikes and erratic network behavior.",
        },
        {
          question: "What causes intermittent connection drops every few minutes?",
          answer:
            "Common causes include Wi-Fi roaming between access points or mesh nodes, interference from microwave ovens or Bluetooth, router thermal throttling (overheating), or DHCP lease renewals failing on cheap gateway hardware.",
        },
        {
          question: "How can I stabilize an unstable Wi-Fi connection?",
          answer:
            "Switch to the 5 GHz or 6 GHz frequency band to avoid 2.4 GHz congestion, move your router away from metal objects and appliances, reposition mesh nodes closer together, or connect your work and gaming devices via Ethernet.",
        },
      ]}
      related={[
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/packet-loss-test", label: "Packet loss test" },
        { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet comparison" },
        { href: "/speed-test", label: "Run standard speed test" },
      ]}
    >
      <HttpProbePanel mode="stability" />

      {/* Stability Durations */}
      <section className="mt-12" aria-labelledby="intervals-heading">
        <h2 id="intervals-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Choosing the Right Test Duration
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Different network issues manifest on different time horizons.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STABILITY_INTERVALS.map((item) => (
            <div key={item.duration} className="rounded-2xl border border-border bg-card p-5">
              <span className="font-mono text-base font-bold text-foreground">{item.duration}</span>
              <p className="mt-1 text-sm font-semibold text-primary">{item.useCase}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deep Dive Guide */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Symptoms of an Unstable Connection
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Video Conferencing:</span>
              &ldquo;Your internet connection is unstable&rdquo; warning appears, voices turn robotic, or webcam video freezes.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Remote Work & VPN:</span>
              Remote Desktop Protocol (RDP), Citrix, or SSH terminal sessions disconnect or stutter when typing.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Online Gaming:</span>
              Sudden lag spikes, input delay, and disconnect icons (red plug/packet loss warning) flash during matches.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Diagnosing Wi-Fi Roaming & Mesh Stutters
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            In homes with mesh Wi-Fi or range extenders, client devices often struggle with &ldquo;sticky access points&rdquo;—clinging to a distant router node until the signal completely drops, then aggressively switching nodes.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Running a 5-minute stability test while walking between rooms reveals whether your mesh system transitions packets smoothly or incurs 2-to-3 second blackout spikes during roaming handoffs.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
