import type { Metadata } from "next";
import { FloorPlannerLoader } from "@/components/mesh/floor-planner-loader";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Placement",
  description: "Plan mesh Wi-Fi placement: draw rooms, drag nodes, and view an estimated coverage map saved on this device.",
  path: "/mesh-wifi/planner",
});

export default function PlannerPage() {
  return (
    <ToolShell
      title="Mesh Wi-Fi placement"
      description="Interactive floor plan for mesh nodes"
      path="/mesh-wifi/planner"
      crumbs={meshCrumbs("Mesh Wi-Fi placement")}
      intro="Add a floor, draw the rooms that matter, and drag nodes. The colors are an estimate. Save a room test afterward if you want a measured speed in that room."
      methodology="The estimate subtracts distance and a typical wall loss when the path enters a room. A node on another floor pays an extra penalty. Zoom and scroll to move around the plan. Undo and redo apply to added rooms and nodes."
      faqs={[
        { question: "Does the color show my real signal?", answer: "No. The label on the planner says the colors are estimated coverage, not a measured signal map." },
      ]}
      related={[
        { href: "/mesh-wifi/guides/where-to-place-mesh-nodes", label: "Placement guide" },
        { href: "/mesh-wifi/dead-zone-test", label: "Test a room" },
        { href: "/mesh-wifi/placement-optimizer", label: "Placement options" },
      ]}
    >
      <FloorPlannerLoader />
    </ToolShell>
  );
}
