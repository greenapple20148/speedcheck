import type { Metadata } from "next";
import { NetworkHealthCompare } from "@/components/network-health/network-health-compare";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Compare Network Changes",
  description: "Save a baseline, record a network change, and compare the follow-up measurement.",
  path: "/network-health/compare",
});

export default function NetworkHealthComparePage() {
  return (
    <ToolShell
      title="Before and after"
      description="Compare two real measurements"
      path="/network-health/compare"
      crumbs={[{ href: "/network-health", label: "Network health" }, { label: "Compare" }]}
      intro="Choose two saved measurements, name the change, and see which numbers improved or got worse."
      methodology="A percentage is the follow-up minus the baseline, divided by the baseline. Latency and jitter improve when they fall. Changes under 3 percent are shown as about the same. Different servers, providers, or Wi-Fi versus Ethernet are called out because they can explain a change."
      related={[
        { href: "/network-health", label: "Network health" },
        { href: "/mesh-wifi/planner", label: "Floor planner" },
      ]}
    >
      <NetworkHealthCompare />
    </ToolShell>
  );
}
