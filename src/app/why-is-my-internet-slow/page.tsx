import type { Metadata } from "next";
import Link from "next/link";
import { SymptomTroubleshooter } from "@/components/diagnostics/symptom-troubleshooter";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Is My Internet Slow? — Diagnostic Checklist & Fixes",
  description:
    "Find out why your internet connection is slow. Step-by-step diagnostic checklist to separate Wi-Fi bottlenecks, router bufferbloat, and ISP line throttling.",
  path: "/why-is-my-internet-slow",
});

const ROOT_CAUSES = [
  { symptom: "Slow on one phone/laptop, but fast on others", probableCause: "Device Wi-Fi antenna or local background downloads", fix: "Restart device, update network adapter drivers, close background apps." },
  { symptom: "Slow on Wi-Fi, but fast when plugged into Ethernet", probableCause: "Wi-Fi radio interference, dead zones, or 2.4 GHz congestion", fix: "Switch to 5 GHz band, relocate router out of closed cabinets, or add mesh nodes." },
  { symptom: "Fast in morning/afternoon, but crawls from 7 PM – 11 PM", probableCause: "Neighborhood cable ISP node congestion", fix: "Track speeds in history, document peak slowdowns, and request ISP line split." },
  { symptom: "Web pages load fine, but videos and games buffer and lag", probableCause: "High jitter or bufferbloat under load", fix: "Run bufferbloat test and enable Smart Queue Management (SQM) on router." },
  { symptom: "Speed is slow across all devices, even wired to modem", probableCause: "Outside line fault, damaged coax splitter, or ISP outage", fix: "Inspect physical cabling and call ISP support to check incoming signal levels." },
];

export default function WhySlowPage() {
  return (
    <ToolShell
      title="Why Is My Internet Slow?"
      description="Interactive symptom troubleshooter and root cause diagnostics"
      path="/why-is-my-internet-slow"
      intro="Internet slowdowns are usually caused by one of three things: real ISP line throttling, household network congestion (bufferbloat), or local Wi-Fi radio interference. Use the diagnostic checklist below to isolate the exact bottleneck."
      methodologyHeading="How to Systematically Diagnose a Slow Connection"
      methodology="Never guess what is wrong—measure each hop. Start by testing your connection on Wi-Fi, then test directly on Ethernet with all other devices disconnected. If wired speeds match your advertised plan, the issue is internal Wi-Fi. If wired speeds are severely degraded, the issue is with your modem or your service provider."
      faqs={[
        {
          question: "Should I restart my router first?",
          answer:
            "Yes, but run a speed test first so you have a baseline number to compare. Power cycle both your modem and router by unplugging them for 30 seconds. If speeds improve immediately, your router was likely suffering from memory fragmentation or thermal throttling.",
        },
        {
          question: "Why is my internet slower in the evening?",
          answer:
            "Cable broadband (DOCSIS) relies on shared neighborhood distribution nodes. During peak evening hours (7 PM to 11 PM), when dozens of neighbors stream 4K movies and download game updates simultaneously, bandwidth at the street node becomes saturated.",
        },
        {
          question: "Can an old router slow down my internet speed?",
          answer:
            "Yes. Routers older than 4–5 years often lack the CPU horsepower to route high-speed gigabit traffic and only support older Wi-Fi standards (Wi-Fi 4/5). Upgrading to a Wi-Fi 6 or Wi-Fi 7 router dramatically improves wireless range and device handling.",
        },
        {
          question: "How do I know if my ISP is throttling my internet?",
          answer:
            "Run a speed test, then connect to a reputable VPN and run the same test again. If video streaming or specific downloads are significantly faster over a VPN, your ISP may be throttling specific types of traffic.",
        },
      ]}
      related={[
        { href: "/speed-test", label: "Run speed test" },
        { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet comparison" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
        { href: "/guides/why-is-my-internet-slow", label: "Full comprehensive guide" },
      ]}
    >
      <SymptomTroubleshooter initialSymptoms={["slow"]} />

      {/* Root Causes Matrix */}
      <section className="mt-12" aria-labelledby="triage-matrix-heading">
        <h2 id="triage-matrix-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Quick Symptom Diagnosis Matrix
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Match your specific slowdown symptoms to the most likely cause and recommended fix.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Symptom</th>
                <th className="px-4 py-3">Root Cause</th>
                <th className="px-4 py-3">Action to Take</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs sm:text-sm">
              {ROOT_CAUSES.map((item) => (
                <tr key={item.symptom} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{item.symptom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.probableCause}</td>
                  <td className="px-4 py-3 text-primary">{item.fix}</td>
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
            The 3-Step Elimination Test
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1. Test on Ethernet:</span>
              Plugging directly into your router isolates whether the speed loss is caused by Wi-Fi distance or radio interference.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2. Check Other Devices:</span>
              If only one smartphone or laptop is slow, the issue is device-specific (power-saving Wi-Fi mode or background sync).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3. Test Directly on Modem:</span>
              Bypass your router completely. If speeds remain slow wired to the modem, the fault is on the ISP line outside.
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Hidden Household Bandwidth Hogs
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Often the internet feels slow because another device is quietly saturating your bandwidth:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Game Consoles:</span>
              PS5 and Xbox consoles frequently download massive 50 GB patches in rest mode.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Smart Security Cameras:</span>
              Multiple 2K/4K cameras uploading continuous footage to the cloud choke your upstream line.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Automatic Smartphone Backups:</span>
              iCloud and Google Photos back up whenever phones are plugged into power.
            </li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
