import type { Metadata } from "next";
import { NodeCalculator } from "@/components/mesh/node-calculator";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "How Many Mesh Nodes Do I Need?",
  description: "Estimate a starting mesh node count from home size, floors, and construction. More nodes are not always faster.",
  path: "/mesh-wifi/node-calculator",
});

export default function NodeCalculatorPage() {
  return (
    <ToolShell
      wide
      hideHeader
      title="How many mesh nodes do I need?"
      description="Starting mesh node count"
      path="/mesh-wifi/node-calculator"
      crumbs={meshCrumbs("How many mesh nodes do I need?")}
      intro="Get a personalized recommendation for your home. Enter a few details to estimate the right number of mesh nodes for reliable Wi-Fi coverage."
      methodologyHeading="How this estimate works"
      methodology="Square meters convert at 10.7639 square feet. Each floor after the first adds 45 percent to the planning area. The suggestion never starts above four nodes. A larger raw count is a warning to measure before you buy the rest."
      faqs={[
        { question: "Should I buy the number it shows?", answer: "Place the starting set, test the weak room, and add a node only if that room is still slow." },
      ]}
      related={[{ href: "/mesh-wifi/guides/how-many-mesh-nodes", label: "How many nodes" }, { href: "/mesh-wifi/planner", label: "Planner" }]}
    >
      <NodeCalculator />
    </ToolShell>
  );
}
