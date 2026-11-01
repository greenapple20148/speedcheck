import type { Metadata } from "next";
import Link from "next/link";
import { SymptomTroubleshooter } from "@/components/diagnostics/symptom-troubleshooter";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Is My Internet Slow?",
  description:
    "Separate a slow plan, a busy link, and a weak Wi-Fi hop. Start with symptoms, then confirm with a measurement.",
  path: "/why-is-my-internet-slow",
});

export default function WhySlowPage() {
  return (
    <ToolShell
      title="Why is my internet slow?"
      description="Slow connection checks"
      path="/why-is-my-internet-slow"
      intro="Slow usually means one of three things: the throughput is actually low, the link is full so latency spikes, or only Wi-Fi is struggling. This page starts the checklist on “internet is slow.” The longer article lives with the other guides."
      methodology="The checklist combines your answers with a saved test when one exists. Without a test, the steps stay general and say what is missing."
      faqs={[
        {
          question: "Should I restart the router first?",
          answer:
            "A restart is reasonable after you have a number to compare. Run one test, restart, then run the same test again so you can see whether anything changed.",
        },
      ]}
      related={[
        { href: "/guides/why-is-my-internet-slow", label: "Full guide" },
        { href: "/speed-test", label: "Speed test" },
      ]}
    >
      <SymptomTroubleshooter initialSymptoms={["slow"]} />
      <p className="mt-4 text-sm text-muted-foreground">
        Prefer the written checklist?{" "}
        <Link href="/guides/why-is-my-internet-slow" className="text-primary hover:underline">
          Read the guide
        </Link>
        .
      </p>
    </ToolShell>
  );
}
