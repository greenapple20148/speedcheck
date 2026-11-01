import type { Metadata } from "next";
import { WifiCompare } from "@/components/mesh/wifi-compare";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Wi-Fi 6 vs Wi-Fi 6E vs Wi-Fi 7",
  description: "Compare Wi-Fi generations by bands, client support, and what actually changes in a house. Newest is not always the right buy.",
  path: "/mesh-wifi/wifi-6-vs-wifi-7",
});

export default function WifiComparePage() {
  return (
    <ToolShell
      title="Wi-Fi 6 vs Wi-Fi 6E vs Wi-Fi 7"
      description="Which Wi-Fi generation fits the devices you have"
      path="/mesh-wifi/wifi-6-vs-wifi-7"
      crumbs={meshCrumbs("Wi-Fi 6 vs Wi-Fi 6E vs Wi-Fi 7")}
      intro="The number on the box is the speed two new devices can attempt in a clear room. Walls, older phones, and a slow ISP still set the result you feel."
      faqs={[
        { question: "Will Wi-Fi 7 make a Wi-Fi 5 laptop faster?", answer: "No. That laptop still uses Wi-Fi 5. The mesh can only offer a newer mode to clients that support it." },
      ]}
      related={[{ href: "/mesh-wifi/node-calculator", label: "Node calculator" }, { href: "/mesh-wifi/guides/mesh-vs-extender", label: "Mesh vs extender" }]}
    >
      <WifiCompare />
    </ToolShell>
  );
}
