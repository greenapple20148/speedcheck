import type { Metadata } from "next";
import { MeshReport } from "@/components/mesh/mesh-report";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Setup Report",
  description: "Print the mesh plan saved in this browser, including node positions, backhaul notes, and room tests.",
  path: "/mesh-wifi/report",
  index: false,
});

export default function ReportPage() {
  return (
    <ToolShell
      title="Mesh setup report"
      description="Printable plan from this browser"
      path="/mesh-wifi/report"
      crumbs={meshCrumbs("Mesh setup report")}
      intro="This report is built from the plan on this device. Use Print and choose Save as PDF. It is not indexed."
      related={[{ href: "/mesh-wifi/planner", label: "Edit the plan" }]}
    >
      <MeshReport />
    </ToolShell>
  );
}
