import type { Metadata } from "next";
import { DnsTimingPanel } from "@/components/diagnostics/dns-timing-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "DNS Timing — Browser Lookup When Available",
  description:
    "Read Resource Timing DNS duration for a same-origin request. Missing data stays unavailable instead of being labeled as DNS.",
  path: "/dns-speed-test",
});

export default function DnsPage() {
  return (
    <ToolShell
      title="DNS timing"
      description="Browser DNS timing when the API exposes it"
      path="/dns-speed-test"
      intro="Browsers do not let a page time an arbitrary DNS resolver. This check reads the Resource Timing lookup interval for one same-origin request, and only when that interval is actually present."
      methodology="domainLookupEnd minus domainLookupStart is shown when both timestamps are positive and the difference is greater than zero. A cached name, a reused connection, or a cross-origin restriction produces an unavailable state. Total HTTP time is never labeled as DNS."
      faqs={[
        {
          question: "Why is the result often unavailable?",
          answer:
            "The browser may reuse a connection or satisfy the name from cache. That hides the lookup. It does not mean DNS took 0 ms.",
        },
      ]}
      related={[
        { href: "/ping-test", label: "Ping test" },
        { href: "/methodology", label: "Methodology" },
      ]}
    >
      <DnsTimingPanel />
    </ToolShell>
  );
}
