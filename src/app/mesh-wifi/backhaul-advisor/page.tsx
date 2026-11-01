import type { Metadata } from "next";
import { BackhaulPanel } from "@/components/mesh/backhaul-panel";
import { ToolShell } from "@/components/seo/tool-shell";
import { ToolPageHero } from "@/components/ui/tool-page-hero";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Ethernet vs Wireless Mesh Backhaul",
  description: "Choose how mesh nodes should link: Ethernet, wireless, MoCA, or powerline, without assuming every model supports each one.",
  path: "/mesh-wifi/backhaul-advisor",
});

export default function BackhaulPage() {
  return (
    <ToolShell
      hideHeader
      title="Ethernet vs wireless mesh backhaul"
      description="How mesh nodes should connect"
      path="/mesh-wifi/backhaul-advisor"
      crumbs={meshCrumbs("Ethernet vs wireless mesh backhaul")}
      intro="The link between nodes is separate from the link to your phone. A cable helps when the model can use it. A wireless hop is normal, and it is not free."
      faqs={[
        { question: "Does every mesh system support Ethernet backhaul?", answer: "No. Some models have a LAN port that can be used for the hop, and some do not. Follow the guide for the model on the node." },
      ]}
      related={[{ href: "/mesh-wifi/guides/ethernet-vs-wireless-backhaul", label: "Ethernet vs wireless" }, { href: "/mesh-wifi/planner", label: "Mark Ethernet outlets" }]}
    >
      <ToolPageHero
        title="Ethernet vs wireless mesh backhaul"
        description="The link between nodes is separate from the link to your phone. A cable helps when the model can use it. A wireless hop is normal, and it is not free."
      />
      <BackhaulPanel />
    </ToolShell>
  );
}
