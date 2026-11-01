import type { Metadata } from "next";
import { MeshTroubleshooter } from "@/components/mesh/mesh-troubleshooter";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Is My Mesh Wi-Fi Slow?",
  description: "A rules checklist for offline nodes, weak upstairs coverage, double NAT, and slow wireless hops. Free steps come first.",
  path: "/mesh-wifi/troubleshooter",
});

export default function MeshTroubleshootPage() {
  return (
    <ToolShell
      title="Why is my mesh Wi-Fi slow?"
      description="Mesh symptom checklist"
      path="/mesh-wifi/troubleshooter"
      crumbs={meshCrumbs("Why is my mesh Wi-Fi slow?")}
      intro="Pick what you see. The checklist uses your symptoms and any room tests saved on this device. It cannot see router settings or which node a device joined."
      faqs={[
        { question: "Can this see my router settings?", answer: "No. Recommendations come from the symptoms you select and any room tests saved on this device." },
      ]}
      related={[
        { href: "/mesh-wifi/guides/upstairs-mesh-coverage", label: "Upstairs coverage" },
        { href: "/mesh-wifi/dead-zone-test", label: "Room test" },
        { href: "/internet-troubleshooter", label: "General troubleshooter" },
      ]}
    >
      <MeshTroubleshooter />
    </ToolShell>
  );
}
