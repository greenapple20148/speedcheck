import type { Metadata } from "next";
import { DeadZoneTester } from "@/components/mesh/dead-zone-tester";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Dead Zones",
  description: "Find mesh Wi-Fi dead zones by saving a speed test to each room. A slow room is not automatically a weak signal.",
  path: "/mesh-wifi/dead-zone-test",
});

export default function DeadZonePage() {
  return (
    <ToolShell
      title="Mesh Wi-Fi dead zones"
      description="Measured throughput by room"
      path="/mesh-wifi/dead-zone-test"
      crumbs={meshCrumbs("Mesh Wi-Fi dead zones")}
      intro="Stand in the room, run the test, and the result is stored with that room on this device. The test does not start by itself."
      methodology="Download, upload, latency, and jitter come from the existing measurement service. The page records the time and the endpoint name. It does not record RSSI or the mesh node name."
      faqs={[
        { question: "Can a slow room mean the ISP is slow?", answer: "Yes. Compare the room with a test beside the primary node before you move hardware." },
      ]}
      related={[
        { href: "/mesh-wifi/guides/upstairs-mesh-coverage", label: "Upstairs coverage" },
        { href: "/speed-test", label: "Speed test" },
        { href: "/mesh-wifi/planner", label: "Planner" },
      ]}
    >
      <DeadZoneTester />
    </ToolShell>
  );
}
