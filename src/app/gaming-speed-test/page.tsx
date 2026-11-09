import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Gaming Speed Test — Ping, Jitter, Packet Loss & Bufferbloat",
  description:
    "Test your internet connection for online gaming. Measure latency under load, jitter, and packet drop rates for competitive titles like Valorant, Fortnite, and Warzone.",
  path: "/gaming-speed-test",
});

const GAME_GENRES = [
  { genre: "Tactical FPS (Valorant, CS2)", targetPing: "< 25 ms", maxJitter: "< 3 ms", bandwidth: "10 – 15 Mbps", note: "Frame-perfect tick rates demand ultra-low latency consistency." },
  { genre: "Battle Royale (Warzone, Fortnite, Apex)", targetPing: "< 40 ms", maxJitter: "< 5 ms", bandwidth: "20 – 25 Mbps", note: "Large lobbies with 100+ players punish packet loss." },
  { genre: "Sports & Fighting (Rocket League, SF6)", targetPing: "< 30 ms", maxJitter: "< 2 ms", bandwidth: "10 Mbps", note: "Rollback netcode relies on near-zero jitter to avoid micro-teleports." },
  { genre: "Cloud Gaming (GeForce Now, Xbox Cloud)", targetPing: "< 20 ms", maxJitter: "< 3 ms", bandwidth: "50+ Mbps", note: "Streams video frames continuously; requires high bandwidth and low ping." },
];

export default function GamingPage() {
  return (
    <ToolShell
      title="Gaming Speed Test"
      description="Benchmark latency, jitter, packet stability, and ping under load"
      path="/gaming-speed-test"
      intro="Online multiplayer games do not need massive gigabit download speeds—they require low ping, zero jitter, zero packet loss, and low latency under load (bufferbloat). Test your network's gaming readiness below."
      methodologyHeading="How Gaming Connection Quality Is Evaluated"
      methodology="This test measures idle round-trip latency (ping), jitter, and packet reliability to our measurement servers. It also runs concurrent download and upload transfers to benchmark your 'latency under load'. If your ping spikes by more than 30 ms while data is transferring, your connection suffers from bufferbloat, which causes severe in-game lag spikes when others use your Wi-Fi."
      faqs={[
        {
          question: "How much internet speed do I really need for gaming?",
          answer:
            "Most online games (like Call of Duty, Fortnite, or Rocket League) only consume 3 to 10 Mbps of bandwidth during active gameplay. High download bandwidth (100–500 Mbps) is only useful for downloading game installers and patches quickly.",
        },
        {
          question: "What is the ideal ping for competitive gaming?",
          answer:
            "Under 20 ms is considered elite esports grade. Between 20 ms and 50 ms is great for all online competitive multiplayer. Above 80 ms, you will experience noticeable hit registration delay and character rubberbanding.",
        },
        {
          question: "Why do I get lag spikes in games even with fast internet?",
          answer:
            "Lag spikes are usually caused by Wi-Fi radio interference, background downloads (game updates or cloud backups), or bufferbloat in your router. When an unmanaged router buffer fills up, gaming packets are held back, causing your ping to instantly jump from 30 ms to 200+ ms.",
        },
        {
          question: "How can I optimize my home network for gaming?",
          answer:
            "1. Connect via Cat6 Ethernet cable instead of Wi-Fi. 2. Enable SQM (Smart Queue Management) or QoS on your router to prioritize gaming traffic. 3. Close background apps like Steam downloads or BitTorrent. 4. Select the geographically nearest server region in your game settings.",
        },
      ]}
      related={[
        { href: "/ping-test", label: "Ping test" },
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet comparison" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />

      {/* Gaming Requirements by Genre */}
      <section className="mt-12" aria-labelledby="gaming-benchmarks-heading">
        <h2 id="gaming-benchmarks-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Network Requirements by Game Genre
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          What your connection needs to remain competitive across different game categories.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Genre & Titles</th>
                <th className="px-4 py-3">Target Ping</th>
                <th className="px-4 py-3">Max Jitter</th>
                <th className="px-4 py-3">Bandwidth</th>
                <th className="px-4 py-3">Key Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {GAME_GENRES.map((g) => (
                <tr key={g.genre} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{g.genre}</td>
                  <td className="px-4 py-3 font-mono text-emerald-500 font-semibold">{g.targetPing}</td>
                  <td className="px-4 py-3 font-mono text-primary">{g.maxJitter}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{g.bandwidth}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.note}</td>
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
            The Bandwidth Myth in Gaming
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Many gamers pay for expensive 1,000 Mbps gigabit plans believing it will improve their multiplayer performance or kill/death ratio.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            During a match, your console or PC only sends small position and action coordinates (approx 120 bytes per packet) at 60 to 128 times per second. That adds up to <strong>less than 5 Mbps</strong>. What wins games is having that 5 Mbps arrive with <strong>sub-20 ms latency and 0 ms jitter</strong>.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Why Wi-Fi Degrades Gaming Netcode
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Wi-Fi utilizes half-duplex radio waves. If your phone, a family member&apos;s laptop, or a smart TV transmits on the same channel at the exact same millisecond as your gaming console, your packet collides and is held in queue.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            That momentary radio contention manifests in-game as an instantaneous 100 ms spike, missing bullets, or character rubberbanding. A simple <Link href="/wifi-vs-ethernet" className="text-primary hover:underline">Cat6 Ethernet cable</Link> completely prevents this.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
