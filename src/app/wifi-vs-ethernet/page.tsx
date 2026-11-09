import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Wi-Fi vs Ethernet — Latency, Speed & Stability Compared",
  description:
    "Compare Wi-Fi vs Ethernet performance with real speed tests. Discover why wired cables beat wireless for gaming, video calls, and large file transfers.",
  path: "/wifi-vs-ethernet",
});

const COMPARISON_ROWS = [
  { metric: "Ping / Latency", ethernet: "1 – 2 ms (rock-solid)", wifi: "5 – 35+ ms (fluctuates with interference)", winner: "Ethernet" },
  { metric: "Throughput (Real vs Advertised)", ethernet: "94% – 98% of line speed", wifi: "35% – 60% of PHY link rate", winner: "Ethernet" },
  { metric: "Packet Loss & Jitter", ethernet: "0.0% loss, < 1 ms jitter", wifi: "Prone to micro-drops & packet retries", winner: "Ethernet" },
  { metric: "Physical Interference", ethernet: "Immune (shielded twisted pair)", wifi: "Degraded by walls, mirrors, microwaves", winner: "Ethernet" },
  { metric: "Mobility & Convenience", ethernet: "Tethered to a cable outlet", wifi: "Total wireless freedom throughout house", winner: "Wi-Fi" },
  { metric: "Device Compatibility", ethernet: "Requires RJ45 port or USB adapter", wifi: "Built into virtually all modern gadgets", winner: "Wi-Fi" },
];

export default function WifiVsEthernetPage() {
  return (
    <ToolShell
      title="Wi-Fi vs Ethernet"
      description="Compare wired and wireless speeds, latency, and stability"
      path="/wifi-vs-ethernet"
      intro="Ethernet connects your computer directly to your router with an insulated copper cable, providing maximum possible throughput and near-zero latency. Wi-Fi transmits data over shared airwaves, trading a portion of speed and consistency for wireless convenience."
      methodologyHeading="How to Benchmark the Wireless Hop"
      methodology="To isolate the exact performance penalty of your Wi-Fi, run this test once while connected to your router via Ethernet, and then immediately run it again on Wi-Fi from your normal seating area. Save both results to your history to see the true throughput gap and latency increase introduced by the wireless link."
      faqs={[
        {
          question: "Is Ethernet always faster than Wi-Fi?",
          answer:
            "In terms of latency and real-world throughput consistency, yes. While high-end Wi-Fi 6E/7 routers boast theoretical speeds of several gigabits, real-world Wi-Fi suffers from half-duplex overhead and radio interference. A standard Cat6 Ethernet cable consistently delivers 940+ Mbps on a gigabit line with 1 ms local ping.",
        },
        {
          question: "Why is Ethernet so much better for gaming?",
          answer:
            "Competitive gaming demands consistent packet arrival (zero jitter and zero packet loss). Wi-Fi must constantly contend for radio airtime with other devices and deal with radio reflections, causing sudden micro-spikes (from 20 ms to 120 ms). Ethernet transmits packets over dedicated copper wires with zero wireless contention.",
        },
        {
          question: "What if I cannot run an Ethernet cable to my room?",
          answer:
            "Consider MoCA (Multimedia over Coax) adapters, which convert existing coaxial TV wall outlets into gigabit-speed Ethernet backhauls with 1–2 ms latency. Powerline adapters (sending data over electrical wiring) are another option, though performance depends heavily on your home's electrical circuit layout.",
        },
        {
          question: "Which Ethernet cable category should I buy?",
          answer:
            "Cat6 or Cat6a is the sweet spot for modern home networking. Cat6 reliably supports up to 10 Gbps speeds at distances up to 165 feet (50 meters) and is backward-compatible with standard 1 Gbps and 2.5 Gbps ports. Avoid expensive Cat7/Cat8 cables for home use as they are often counterfeit or unnecessary.",
        },
      ]}
      related={[
        { href: "/wifi-speed-test", label: "Wi-Fi speed test" },
        { href: "/speed-test", label: "Broadband speed test" },
        { href: "/gaming-speed-test", label: "Gaming speed test" },
        { href: "/guides/how-to-improve-wifi-speed", label: "How to improve Wi-Fi" },
      ]}
    >
      <SpeedTestDashboard />

      {/* Comparison Matrix */}
      <section className="mt-12" aria-labelledby="comparison-matrix-heading">
        <h2 id="comparison-matrix-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Direct Comparison: Ethernet vs Wi-Fi
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Key performance differences between wired cables and wireless networking.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Ethernet (Cat6)</th>
                <th className="px-4 py-3">Wi-Fi (5 GHz / 6 GHz)</th>
                <th className="px-4 py-3">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.metric} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{row.metric}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{row.ethernet}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{row.wifi}</td>
                  <td className="px-4 py-3 font-medium text-primary">{row.winner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ideal Use Cases */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Devices That Belong on Ethernet
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Desktop PCs & Workstations:</span>
              Maximizes transfer speeds for large work files, git repositories, and cloud backups.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Gaming Consoles (PS5, Xbox, PC):</span>
              Eliminates latency spikes and finishes 80 GB game patches in minutes.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Smart TVs & 4K Streaming Boxes:</span>
              Prevents buffering wheels and frees up Wi-Fi airtime for mobile devices.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Network Attached Storage (NAS):</span>
              Ensures high-speed local backups and media streaming over Plex.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Devices Best Suited for Wi-Fi
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Smartphones & Tablets:</span>
              Portability is paramount; modern mobile radios handle 400+ Mbps on 5 GHz effortlessly.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Laptops on the Move:</span>
              Working from the couch, dining table, or patio without tangled wires.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Smart Home IoT Devices:</span>
              Smart bulbs, door locks, and robotic vacuums only require minimal 2.4 GHz bandwidth.
            </li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
