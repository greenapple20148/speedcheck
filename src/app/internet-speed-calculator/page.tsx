import type { Metadata } from "next";
import { HouseholdPlanner } from "@/components/calculators/calculators";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Internet Speed Calculator — Household Bandwidth",
  description:
    "Add up planning bandwidth for streams, calls, and backups. This estimate does not measure your connection.",
  path: "/internet-speed-calculator",
});

export default function SpeedCalculatorPage() {
  return (
    <ToolShell
      title="Internet speed calculator"
      description="Household bandwidth planner"
      path="/internet-speed-calculator"
      intro="Add the activities that happen at the same time. The totals are planning estimates from published-style reference rates, not a reading from your modem."
      methodology="Each activity has a fixed download and upload allowance. The page multiplies by the count you enter and compares the sum with the plan speeds you type."
      faqs={[
        {
          question: "Does a high percentage mean the plan is too small?",
          answer:
            "It means the activities you listed can fill that share of the plan if they all run at once. Measure before you change plans.",
        },
      ]}
      related={[
        { href: "/streaming-speed-test", label: "Streaming test" },
        { href: "/speed-test", label: "Measure your line" },
      ]}
    >
      <HouseholdPlanner />
    </ToolShell>
  );
}
