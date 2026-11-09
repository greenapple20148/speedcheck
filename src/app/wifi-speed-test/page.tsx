import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Wi-Fi Speed Test — Test Wireless Signal & Throughput",
  description:
    "Test your Wi-Fi download and upload speed. Compare 2.4 GHz, 5 GHz, and 6 GHz bands, identify wireless dead zones, and optimize router placement.",
  path: "/wifi-speed-test",
});

const WIFI_BANDS = [
  { band: "2.4 GHz (Wi-Fi 4 / 6)", realSpeed: "40 – 90 Mbps", range: "Superior (150+ ft)", interference: "High (Microwaves, Bluetooth)", bestFor: "Smart home IoT, outdoor cameras, long-range coverage" },
  { band: "5 GHz (Wi-Fi 5 / 6)", realSpeed: "300 – 700 Mbps", range: "Moderate (~50 – 75 ft)", interference: "Low", bestFor: "4K streaming, consoles, laptops, video calls" },
  { band: "6 GHz (Wi-Fi 6E / 7)", realSpeed: "900 – 1,800+ Mbps", range: "Short (~30 – 40 ft)", interference: "Zero (Exclusive band)", bestFor: "Gigabit downloads, VR headsets, ultra-low latency gaming" },
];

export default function WifiSpeedTestPage() {
  return (
    <ToolShell
      title="Wi-Fi Speed Test"
      description="Measure wireless performance, signal degradation, and dead zones"
      path="/wifi-speed-test"
      intro="Wi-Fi speed depends on your distance from the router, wall materials, radio frequency bands, and neighboring wireless interference. Test your wireless connection in different rooms to locate coverage bottlenecks."
      methodologyHeading="Testing Wireless Performance Accurately"
      methodology="To accurately evaluate Wi-Fi health, run this test once right next to your wireless router, and then repeat the test in your bedroom, basement, or home office. The speed delta between the two locations reveals the exact performance drop introduced by distance and physical obstructions."
      faqs={[
        {
          question: "Why is my Wi-Fi speed much slower than the speed I pay for?",
          answer:
            "Your ISP delivers bandwidth to your modem, but distributing that speed over radio waves encounters physical loss. Obstacles like drywall, metal pipes, and concrete absorb Wi-Fi signals. Furthermore, Wi-Fi is half-duplex (devices cannot transmit and receive simultaneously on the same channel), which inherently reduces throughput by 30% to 50% compared to wired Ethernet.",
        },
        {
          question: "Should I connect to the 2.4 GHz, 5 GHz, or 6 GHz Wi-Fi band?",
          answer:
            "Always use 5 GHz or 6 GHz for laptops, phones, and gaming consoles located within 1 to 2 rooms of the router for maximum speed. Reserve the 2.4 GHz network for smart home smart plugs, thermostats, and distant devices because 2.4 GHz penetrates thick walls much better.",
        },
        {
          question: "What is the best location for my Wi-Fi router?",
          answer:
            "Place your router centrally in your home, elevated off the ground (e.g. on a desk or shelf), and out in the open. Placing a router inside a closed TV cabinet, behind a sofa, or in the basement severely degrades wireless signal throughout the house.",
        },
        {
          question: "Will a mesh Wi-Fi system fix slow speeds?",
          answer:
            "Yes, if your home is larger than 2,000 square feet or has multiple floors. Mesh nodes blanket your home in a single unified network. For maximum mesh performance, connect the satellite nodes with Ethernet backhaul rather than wireless backhaul.",
        },
        {
          question: "Why does my router box say 3,000 Mbps if I can only get 600 Mbps?",
          answer:
            "The numbers printed on router packaging (like AX3000 or BE9300) represent theoretical maximum physical link rates added together across all radio bands simultaneously under laboratory conditions. No single client device can ever reach that combined total.",
        },
      ]}
      related={[
        { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet comparison" },
        { href: "/guides/how-to-improve-wifi-speed", label: "How to improve Wi-Fi speed" },
        { href: "/speed-test", label: "Full broadband speed test" },
        { href: "/mesh-wifi", label: "Mesh Wi-Fi planner" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />

      {/* Wi-Fi Frequency Bands Table */}
      <section className="mt-12" aria-labelledby="wifi-bands-heading">
        <h2 id="wifi-bands-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Wi-Fi Frequency Bands Compared: 2.4 GHz vs 5 GHz vs 6 GHz
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Real-world throughput expectations and optimal use cases for modern wireless frequencies.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Frequency Band</th>
                <th className="px-4 py-3">Real-World Throughput</th>
                <th className="px-4 py-3">Effective Range</th>
                <th className="px-4 py-3">Interference Level</th>
                <th className="px-4 py-3">Best Used For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {WIFI_BANDS.map((item) => (
                <tr key={item.band} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{item.band}</td>
                  <td className="px-4 py-3 font-mono font-medium text-primary">{item.realSpeed}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.range}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.interference}</td>
                  <td className="px-4 py-3 text-foreground">{item.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Optimization Tips */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Top 4 Wi-Fi Signal Blockers Inside Homes
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Dense Materials:</span>
              Concrete walls, brick fireplaces, and ceramic bathroom tiles can cut Wi-Fi signal strength by up to 70%.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. Metal & Mirrors:</span>
              Large decorative mirrors and stainless steel kitchen appliances reflect and scatter radio waves.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. 2.4 GHz Radio Noise:</span>
              Microwave ovens, baby monitors, and older cordless phones broadcast on the exact same 2.4 GHz spectrum.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">4. Neighbor Overlap:</span>
              In apartments, dozens of neighboring routers broadcasting on default channels create co-channel interference.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            How to Map Dead Zones with This Test
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">Step 1:</span>
              Run a baseline test sitting in the same room as your router. Note your download speed and ping.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">Step 2:</span>
              Walk to your home office or master bedroom, shut the door, and run the test again.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">Step 3:</span>
              If speed drops by more than 50% or ping spikes above 50 ms, that room is a Wi-Fi dead zone. Consider an access point or mesh node.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
