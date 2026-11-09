import type { Metadata } from "next";
import Link from "next/link";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Packet Loss Test — Check Network Request Drop Rate",
  description:
    "Test your network connection for packet loss and dropped requests. Learn what causes packet loss in games, Zoom calls, and how to fix it.",
  path: "/packet-loss-test",
});

const LOSS_THRESHOLDS = [
  { rating: "Perfect", range: "0.0%", color: "text-emerald-500", desc: "No dropped requests. Flawless for competitive gaming, VoIP, and streaming." },
  { rating: "Acceptable", range: "< 1.0%", color: "text-teal-500", desc: "Rare packet drops; negligible impact on web browsing, minor stutter in games." },
  { rating: "Noticeable", range: "1.0% – 3.0%", color: "text-amber-500", desc: "Robotic voice in Discord/Zoom, character teleporting (rubberbanding) in games." },
  { rating: "Critical", range: "> 3.0%", color: "text-rose-500", desc: "Severe connection dropouts, call freezes, and frequent multiplayer disconnections." },
];

export default function PacketLossPage() {
  return (
    <ToolShell
      title="Packet Loss Test"
      description="Measure HTTP request delivery reliability and drop rates"
      path="/packet-loss-test"
      intro="Packet loss occurs when units of data traveling across a network fail to arrive at their destination. Even a small percentage of lost packets can cause severe stuttering in voice calls, rubberbanding in multiplayer games, and sluggish browsing."
      methodologyHeading="How Loss Is Measured in the Browser"
      methodology="Because web browsers run in security sandboxes that prohibit raw ICMP or UDP ping sockets, this diagnostic test executes a controlled sequence of 30 sequential HTTP requests to our measurement endpoint. Each probe monitors timeout duration, network layer aborts, and non-200 responses. The loss percentage reflects the ratio of failed requests to total attempted transmissions."
      faqs={[
        {
          question: "What is an acceptable percentage of packet loss?",
          answer:
            "Ideally, packet loss should be 0.0%. For web browsing and streaming video, 1% loss is typically unnoticeable because TCP retransmits missing packets automatically. For competitive gaming, Discord, or Zoom, anything over 1% to 2% causes noticeable stutter, robotic audio, and lag.",
        },
        {
          question: "What causes packet loss?",
          answer:
            "The most common causes include weak Wi-Fi signal, damaged Ethernet cables, faulty network switches, saturated bandwidth (bufferbloat), overheating routers, or physical degradation on the coaxial cable or fiber line outside your home.",
        },
        {
          question: "Why is packet loss worse than high ping for gaming?",
          answer:
            "With steady high ping (e.g. 80 ms), the game remains predictable—actions are just delayed. With packet loss, the server never receives your inputs (or you never receive enemy positions), leading to sudden teleportation, ghost bullets, and rubberbanding.",
        },
        {
          question: "How do I fix packet loss on my home connection?",
          answer:
            "1. Switch from Wi-Fi to a wired Ethernet cable. 2. Restart your router and modem. 3. Check Ethernet cables for bent pins or damage. 4. If packet loss persists on a wired connection directly plugged into the modem, the issue is on your ISP's street node or incoming line.",
        },
        {
          question: "Can an overloaded router cause packet loss?",
          answer:
            "Yes. When a router's CPU or memory is overwhelmed by dozens of active devices, torrents, or heavy transfers, its buffer queues overflow and it drops incoming packets (buffer drop).",
        },
      ]}
      related={[
        { href: "/connection-stability-test", label: "Stability test" },
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/ping-test", label: "Ping test" },
        { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet" },
      ]}
    >
      <HttpProbePanel mode="loss" />

      {/* Packet Loss Thresholds */}
      <section className="mt-12" aria-labelledby="loss-thresholds-heading">
        <h2 id="loss-thresholds-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Packet Loss Severity Scale
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          See how different levels of packet loss impact everyday applications and multiplayer gaming.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOSS_THRESHOLDS.map((item) => (
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

      {/* Deep Dive */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            TCP vs UDP: Why Streaming Survives While Games Stutter
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Internet traffic relies on two primary transmission protocols:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• TCP (Web & Netflix):</span>
              TCP requires every packet to be acknowledged. If a packet is lost, the receiver asks for it again while you watch buffered video. You rarely notice 1% packet loss on YouTube.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• UDP (Gaming & Calls):</span>
              Real-time applications use UDP because there is no time to re-request lost packets. If packet #45 is lost, the game simply skips forward—causing character teleportation and audio glitches.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Troubleshooting Checklist
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Test with Ethernet:</span>
              90% of household packet loss is caused by Wi-Fi interference from distance, appliances, or neighboring routers.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. Inspect Physical Cabling:</span>
              Damaged RJ45 connectors or bent coax splitters cause intermittent packet loss.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. Power Cycle Gateway:</span>
              Clears corrupted routing tables and resets thermal throttling on your modem.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">4. Contact ISP Support:</span>
              If wired packet loss persists, request a line check for downstream noise and uncorrectable codewords.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
