import type { Metadata } from "next";
import { Suspense } from "react";
import { NetworkHealthDashboard } from "@/components/network-health/network-health-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Network Health",
  description: "See measured download, upload, latency, bufferbloat, and room tests, then compare a change you make.",
  path: "/network-health",
});

export default function NetworkHealthPage() {
  return (
    <ToolShell
      title="Network health"
      description="Measured connection health"
      path="/network-health"
      crumbs={[{ label: "Network health" }]}
      intro="This dashboard shows completed speed tests and room tests saved on this device. Empty fields were not measured."
      methodology="Download, upload, latency, jitter, and bufferbloat come from the speed test you run. Gaming, streaming, and video-call labels are assessments of those measurements. Room rows are throughput tests, separate from the planner’s estimated coverage. Comparisons stay in this browser."
      faqs={[
        { question: "Does an empty card mean the connection failed?", answer: "No. It means that metric was not part of the saved test." },
        { question: "Are the planner colors the same as these speeds?", answer: "No. Planner colors are an estimate. Room rows here are measured throughput." },
      ]}
      related={[
        { href: "/speed-test", label: "Speed test" },
        { href: "/network-health/compare", label: "Before and after" },
        { href: "/mesh-wifi/planner", label: "Floor planner" },
      ]}
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading network health…</p>}>
        <NetworkHealthDashboard />
      </Suspense>
    </ToolShell>
  );
}
