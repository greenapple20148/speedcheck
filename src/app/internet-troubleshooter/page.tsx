import type { Metadata } from "next";
import { SymptomTroubleshooter } from "@/components/diagnostics/symptom-troubleshooter";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Is My Internet Slow? Test & Troubleshoot",
  description:
    "Pick a symptom, add a little context, and get checks you can retest. Rules stay on this site and do not invent measurements.",
  path: "/internet-troubleshooter",
});

export default function TroubleshooterPage() {
  return (
    <ToolShell
      title="Internet troubleshooter"
      description="Deterministic checks from symptoms and saved tests"
      path="/internet-troubleshooter"
      intro="Choose what you notice. If you have saved a speed test in this browser, the checklist uses those numbers. It will not claim a router or modem has failed."
      methodology="Rules are fixed: for example, usable download with a large latency increase under load points to queueing, not to a dead radio. Each step includes why it might help, how to retest, what you should see, and a confidence level."
      faqs={[
        {
          question: "Do I need an account?",
          answer: "No. Saved tests stay in this browser until you delete them or turn saving on in Settings.",
        },
      ]}
      related={[
        { href: "/speed-test", label: "Speed test" },
        { href: "/why-is-my-internet-slow", label: "Why it feels slow" },
      ]}
    >
      <SymptomTroubleshooter />
    </ToolShell>
  );
}
