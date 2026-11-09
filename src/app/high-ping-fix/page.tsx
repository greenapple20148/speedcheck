import type { Metadata } from "next";
import Link from "next/link";
import { HttpProbePanel } from "@/components/diagnostics/http-probe-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "High Ping Fix — How to Reduce Latency and Lag Spikes",
  description:
    "Step-by-step troubleshooting guide to diagnose and fix high ping, jitter, and lag spikes in online games, video calls, and remote work.",
  path: "/high-ping-fix",
});

const PING_FIX_STEPS = [
  { step: "1", title: "Switch to a Wired Ethernet Cable", impact: "High (-10 to -30 ms)", desc: "Wi-Fi is vulnerable to radio contention, wall absorption, and packet retransmissions. A direct Cat6 cable eliminates wireless latency instantly." },
  { step: "2", title: "Enable SQM on Your Router", impact: "Very High (-50 to -300 ms under load)", desc: "Smart Queue Management (CAKE or fq_codel) stops downloads from congesting your router's queue. Run our bufferbloat test to confirm." },
  { step: "3", title: "Pause Cloud Backups & Game Updates", impact: "High", desc: "Background sync services (OneDrive, iCloud, Steam patches) saturate your upload pipe, causing instant ping spikes." },
  { step: "4", title: "Select the Closest Game Server Region", impact: "High (-30 to -80 ms)", desc: "Physics dictates ping. Connecting to a game server across the continent or ocean will always have higher latency than a local server." },
  { step: "5", title: "Restart Modem and Router", impact: "Medium", desc: "Clears memory leaks, thermal throttling buffers, and renegotiates clean frequency channels with your ISP's headend." },
  { step: "6", title: "Change DNS to Cloudflare or Google", impact: "Low to Medium", desc: "While DNS doesn't lower in-game UDP ping, 1.1.1.1 or 8.8.8.8 accelerates initial match handshakes and web browsing lookups." },
];

export default function HighPingPage() {
  return (
    <ToolShell
      title="High Ping & Latency Troubleshooting"
      description="Measure real-time latency and follow a proven retest plan to reduce lag"
      path="/high-ping-fix"
      intro="High ping makes multiplayer games feel delayed and causes video call voices to lag. Diagnosing high ping requires isolating whether the delay originates on your computer, your home Wi-Fi, your router's queue, or your ISP's outside line."
      methodologyHeading="How to Systematically Isolate High Latency"
      methodology="Start by running the latency probe below while connected via Wi-Fi. Then, plug your device directly into the router with an Ethernet cable and run the test again. If latency drops dramatically on Ethernet, your Wi-Fi environment is the source. If latency remains high on a direct cable with all other devices disconnected, the delay lies with your ISP line or regional routing."
      faqs={[
        {
          question: "Why is my ping suddenly so high?",
          answer:
            "Sudden ping spikes are most commonly caused by another device on your network starting a heavy download or cloud upload (bufferbloat), background Windows or console updates, Wi-Fi channel interference, or temporary ISP routing outages.",
        },
        {
          question: "Can internet service providers fix high ping?",
          answer:
            "If the ping is high on a wired Ethernet connection directly into your modem with no other devices active, yes. Your ISP can inspect coaxial cable signal levels, replace faulty outdoor splitters, or re-route your traffic around congested neighborhood nodes.",
        },
        {
          question: "Will buying a faster internet plan lower my ping?",
          answer:
            "Usually no. Upgrading from 100 Mbps to 500 Mbps increases bandwidth (data volume), but packets still travel over the same physical wires at the same speed. The only exception is upgrading from DSL/cable to fiber optic internet, which fundamentally reduces latency by replacing copper with optical fiber.",
        },
        {
          question: "Do gaming VPNs actually lower ping?",
          answer:
            "Generally no, because a VPN adds an extra server hop to your journey. However, in rare cases where your ISP routes traffic through inefficient, convoluted peering routes, a gaming VPN with optimized routing can shave off 5 to 15 ms.",
        },
      ]}
      related={[
        { href: "/ping-test", label: "Ping test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/gaming-speed-test", label: "Gaming speed test" },
      ]}
    >
      <HttpProbePanel mode="ping" />

      {/* Actionable Steps Grid */}
      <section className="mt-12" aria-labelledby="ping-fixes-heading">
        <h2 id="ping-fixes-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          6 Proven Fixes to Reduce High Ping
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Follow these ranked steps to troubleshoot and eliminate latency bottlenecks.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PING_FIX_STEPS.map((item) => (
            <div key={item.step} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {item.step}
                </span>
                <span className="text-xs font-semibold text-emerald-500">{item.impact}</span>
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bufferbloat vs Idle Ping */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Idle Ping vs Ping Under Load (Bufferbloat)
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Does your ping look fine (e.g. 25 ms) until someone in the house starts watching a stream or downloads an app update, at which point your ping skyrockets to 250 ms?
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This is called <strong>Bufferbloat</strong>. When your router cannot process outgoing or incoming data fast enough, it stores excess packets in memory buffers. Real-time gaming packets get stuck behind massive file downloads. Run our{" "}
            <Link href="/bufferbloat-test" className="text-primary hover:underline">
              Bufferbloat Test
            </Link>{" "}
            to check your grade.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            How to Test Your Modem Directly
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            To determine whether your router is the bottleneck or if the problem is your ISP:
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1.</span>
              Unplug your router from the modem.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2.</span>
              Plug your laptop directly into the modem&apos;s Ethernet port and power cycle the modem.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3.</span>
              Run this ping test. If ping is low, your router or household Wi-Fi was causing the lag.
            </li>
          </ol>
        </div>
      </div>
    </ToolShell>
  );
}
