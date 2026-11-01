import type { Metadata } from "next";
import { PlacementPanel } from "@/components/mesh/placement-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { ToolPageHero } from "@/components/ui/tool-page-hero";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Best Placement for Mesh Nodes",
  description: "Compare mesh node placement for wider coverage, fewer nodes, Ethernet outlets, and priority rooms.",
  path: "/mesh-wifi/placement-optimizer",
});

export default function PlacementPage() {
  return (
    <ToolShell
      hideHeader
      title="Best placement for mesh nodes"
      description="Candidate mesh layouts"
      path="/mesh-wifi/placement-optimizer"
      crumbs={meshCrumbs("Best placement for mesh nodes")}
      intro="Apply one layout, then drag the nodes. These options follow simple spacing rules. They are not a mathematical optimum."
      faqs={[
        { question: "Is this the best possible mesh layout?", answer: "These are four understandable options: wider spacing, fewer nodes, marked Ethernet, and priority rooms. Drag the nodes and retest a room before you treat one as final." },
      ]}
      related={[
        { href: "/mesh-wifi/guides/where-to-place-mesh-nodes", label: "Placement guide" },
        { href: "/mesh-wifi/planner", label: "Floor planner" },
        { href: "/mesh-wifi/node-calculator", label: "Node calculator" },
      ]}
    >
      <ToolPageHero
        title="Best placement for mesh nodes"
        description="Apply one layout, then drag the nodes. These options follow simple spacing rules. They are not a mathematical optimum."
      />
      <PlacementPanel />
    </ToolShell>
  );
}
