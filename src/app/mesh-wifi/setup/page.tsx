import type { Metadata } from "next";
import { SetupWizard } from "@/components/mesh/setup-wizard";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Setup",
  description: "Set up eero, Nest Wifi, Deco, Orbi, ZenWiFi, Velop, or another mesh kit. The Wi-Fi password stays in the vendor app.",
  path: "/mesh-wifi/setup",
});

export default function SetupPage() {
  return (
    <ToolShell
      title="Mesh Wi-Fi setup"
      description="Guided mesh installation checklist"
      path="/mesh-wifi/setup"
      crumbs={meshCrumbs("Mesh Wi-Fi setup")}
      intro="Pick the brand, enter the house, then follow a checklist. Open the manufacturer’s guide for your exact model. This site does not log into your router."
      faqs={[
        { question: "Why is there no password field?", answer: "The Wi-Fi password and the router admin password stay in the vendor app. This wizard stores a network name only if you type one." },
      ]}
      related={[{ href: "/mesh-wifi/brands", label: "Brand notes" }, { href: "/mesh-wifi/planner", label: "Planner" }]}
    >
      <SetupWizard />
    </ToolShell>
  );
}
