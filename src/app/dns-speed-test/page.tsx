import type { Metadata } from "next";
import Link from "next/link";
import { DnsTimingPanel } from "@/components/diagnostics/dns-timing-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "DNS Speed Test — Measure Domain Lookup Latency",
  description:
    "Test your browser DNS lookup timing and response speed. Learn how public DNS resolvers like Cloudflare and Google can speed up your web browsing.",
  path: "/dns-speed-test",
});

const POPULAR_RESOLVERS = [
  { provider: "Cloudflare DNS", primary: "1.1.1.1", secondary: "1.0.0.1", focus: "Ultra-low latency, strict zero-logging privacy policy." },
  { provider: "Google Public DNS", primary: "8.8.8.8", secondary: "8.8.4.4", focus: "Global reliability, massive anycast network, EDNS client subnet support." },
  { provider: "Quad9 DNS", primary: "9.9.9.9", secondary: "149.112.112.112", focus: "Automated threat intelligence blocking malware and phishing domains." },
  { provider: "Standard ISP DNS", primary: "Assigned by ISP", secondary: "Assigned by ISP", focus: "Default resolver; often slower with browsing telemetry collection." },
];

export default function DnsPage() {
  return (
    <ToolShell
      title="DNS Timing & Lookup Speed Test"
      description="Measure domain name resolution duration and resolver latency"
      path="/dns-speed-test"
      intro="The Domain Name System (DNS) translates website addresses like 'myspeedguage.com' into computer IP addresses. Fast DNS resolution makes web pages feel snappy and load without initial pauses."
      methodologyHeading="How DNS Timing Is Evaluated in the Browser"
      methodology="Browsers enforce strict security boundaries around low-level network sockets. This tool accesses the browser's PerformanceResourceTiming API to measure the domainLookupStart and domainLookupEnd timestamps for newly established connections. To measure an uncached resolution, it requests a unique, randomized subdomain from an anycast DNS resolver."
      faqs={[
        {
          question: "How does DNS speed affect my overall internet experience?",
          answer:
            "Every modern webpage loads assets (images, analytics, fonts, scripts) from 10 to 30 different domains. If your DNS resolver takes 80 ms instead of 15 ms per lookup, your browser spends unnecessary seconds waiting before downloading actual webpage content.",
        },
        {
          question: "What is the fastest public DNS resolver?",
          answer:
            "Independent global benchmarks routinely rate Cloudflare's 1.1.1.1 as the fastest public DNS resolver in most regions, closely followed by Google Public DNS (8.8.8.8). Changing to one of these resolvers often improves browsing snappiness over your ISP's default resolver.",
        },
        {
          question: "Will changing my DNS server increase my download speed?",
          answer:
            "No. DNS only speeds up the initial handshake that finds the server's IP address. It will not increase your raw bandwidth (e.g. from 100 Mbps to 200 Mbps) or make file downloads finish faster once the transfer begins.",
        },
        {
          question: "Why does the DNS result sometimes show as cached or unavailable?",
          answer:
            "Operating systems and modern browsers aggressively cache DNS records so they don't have to re-resolve the same domain repeatedly. When an existing TCP connection or socket is reused, the browser reports 0 ms or omits the DNS phase entirely.",
        },
        {
          question: "How do I switch to a faster DNS on my router?",
          answer:
            "Log into your router's admin portal (commonly 192.168.1.1 or 192.168.0.1), navigate to WAN / Internet Settings, locate the DNS Configuration field, and enter 1.1.1.1 and 1.0.0.1 (or 8.8.8.8 and 8.8.4.4). This upgrades DNS for every device on your home network.",
        },
      ]}
      related={[
        { href: "/ping-test", label: "Ping test" },
        { href: "/speed-test", label: "Run internet speed test" },
        { href: "/diagnostics", label: "Network diagnostics" },
      ]}
    >
      <DnsTimingPanel />

      {/* Top DNS Resolvers */}
      <section className="mt-12" aria-labelledby="resolvers-heading">
        <h2 id="resolvers-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Top Public DNS Resolvers Compared
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Free, secure alternatives to replace your default internet service provider DNS.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {POPULAR_RESOLVERS.map((r) => (
            <div key={r.provider} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">{r.provider}</h3>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="rounded bg-muted px-2 py-1 font-mono font-medium text-foreground">
                  Primary: {r.primary}
                </span>
                <span className="rounded bg-muted px-2 py-1 font-mono font-medium text-foreground">
                  Secondary: {r.secondary}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{r.focus}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DNS Explained */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Why Default ISP DNS Servers Are Often Suboptimal
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            When you plug in your ISP&apos;s default router, it automatically configures your devices to use the provider&apos;s local DNS resolvers.
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Slower Infrastructure:</span>
              Many ISP resolvers have smaller caches and higher response times during peak evening hours.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Privacy Concerns:</span>
              ISPs can log your DNS requests to monitor every domain your household visits.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Search Redirection:</span>
              Some ISPs hijack mistyped URLs and redirect you to search ad landing pages.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            DNS-over-HTTPS (DoH) & Encrypted Lookups
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Traditional DNS requests are sent in clear text (port 53 UDP), allowing anyone on your local network or upstream ISP to snoop on the websites you visit.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Modern browsers (Chrome, Firefox, Safari) and operating systems now support <strong>DNS over HTTPS (DoH)</strong>. By encrypting your DNS queries inside standard HTTPS traffic, DoH prevents third parties from eavesdropping on your browsing activity.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
