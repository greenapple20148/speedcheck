import type { Metadata } from "next";
import Link from "next/link";
import {
  Cable,
  Calculator,
  Gauge,
  LayoutGrid,
  LogIn,
  Map,
  Router,
  Sparkles,
  Wrench,
  Wifi,
} from "lucide-react";
import { ToolShell } from "@/components/seo/tool-shell";
import { MeshHeroArt } from "@/components/ui/tool-art";
import { ToolCard } from "@/components/ui/tool-card";
import { ToolPageHero } from "@/components/ui/tool-page-hero";
import { MESH_GUIDES } from "@/lib/mesh/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Setup and Placement",
  description: "Plan mesh Wi-Fi placement, estimate how many nodes you need, and test each room before you buy more hardware.",
  path: "/mesh-wifi",
});

function groupId(title: string) {
  return `mesh-group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

const GROUPS = [
  {
    title: "Plan & Design",
    tools: [
      {
        href: "/mesh-wifi/planner",
        name: "Mesh Planner",
        benefit: "Draw rooms, drag nodes, and see an estimated coverage map you can correct with measurements.",
        icon: Map,
      },
      {
        href: "/mesh-wifi/placement-optimizer",
        name: "Node Placement",
        benefit: "Four layouts you can apply and then edit. Not a claim of a perfect plan.",
        icon: LayoutGrid,
      },
      {
        href: "/mesh-wifi/node-calculator",
        name: "Node Calculator",
        benefit: "A starting count from size and construction, including when one router is enough.",
        icon: Calculator,
      },
    ],
  },
  {
    title: "Setup & Configuration",
    tools: [
      {
        href: "/router-setup",
        name: "Router Setup",
        benefit: "Brand, login page, placement checklist, and a speed test you start yourself. The password stays on the vendor page.",
        icon: Router,
      },
      {
        href: "/mesh-wifi/setup",
        name: "Mesh Setup Assistant",
        benefit: "A model-aware checklist for eero, Nest, Deco, Orbi, ZenWiFi, Velop, or another kit.",
        icon: Wifi,
      },
      {
        href: "/mesh-wifi/planner",
        name: "Router Login Assistant",
        benefit: "Open Connect to router in the floor planner. The gateway stays in this browser.",
        icon: LogIn,
      },
    ],
  },
  {
    title: "Test & Troubleshoot",
    tools: [
      {
        href: "/mesh-wifi/dead-zone-test",
        name: "Room Testing",
        benefit: "Run the speed test in a room you choose and keep that result with the room.",
        icon: Gauge,
      },
      {
        href: "/mesh-wifi/troubleshooter",
        name: "Wi-Fi Troubleshooting",
        benefit: "Rules from your symptoms and any room tests you saved.",
        icon: Wrench,
      },
      {
        href: "/mesh-wifi/backhaul-advisor",
        name: "Backhaul",
        benefit: "Ethernet, wireless, coax, and powerline, with the limits called out.",
        icon: Cable,
      },
    ],
  },
  {
    title: "Learn & Optimize",
    tools: [
      {
        href: "/mesh-wifi/wifi-6-vs-wifi-7",
        name: "Wi-Fi 6, 6E, and 7",
        benefit: "What changes in a house, and when the newest kit does not help.",
        icon: Sparkles,
      },
    ],
  },
];

export default function MeshHomePage() {
  return (
    <ToolShell
      hideHeader
      title="Mesh Wi-Fi setup and placement"
      description="Plan, set up, test, and adjust a mesh network"
      path="/mesh-wifi"
      intro="Plan where nodes go, set the system up without sending this site your Wi-Fi password, then measure the rooms that matter. Buying another node is the step after a placement change still fails."
      methodology="Coverage colors are a browser-side estimate from distance, wall type, band, and floors. Room results are the same HTTP speed test used on the rest of the site. Neither one is a Wi-Fi signal-strength map."
      faqs={[
        { question: "Do I need an account?", answer: "No. The plan stays in this browser until you export or delete it." },
        { question: "Will this tell me which mesh node my phone is using?", answer: "No. A browser speed test cannot see the connected node, the channel, or router settings." },
      ]}
      related={[
        { href: "/mesh-wifi/guides/where-to-place-mesh-nodes", label: "Best node placement" },
        { href: "/mesh-wifi/guides/mesh-vs-extender", label: "Mesh vs extender" },
        { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet" },
      ]}
    >
      <ToolPageHero
        title="Wi-Fi & Mesh Tools"
        description="Plan, set up, and troubleshoot a home Wi-Fi or mesh network. Node counts and coverage colors are estimates you can check with a speed test."
        chips={[
          { label: "Plan & set up", icon: Wifi },
          { label: "Optimize coverage", icon: LayoutGrid },
          { label: "Troubleshoot & fix", icon: Wrench },
        ]}
        illustration={<MeshHeroArt />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={groupId(group.title)}>
            <h2 id={groupId(group.title)} className="text-sm font-semibold uppercase tracking-wide text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">
              {group.title}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {group.tools.map((tool) => (
                <li key={tool.name}>
                  <ToolCard href={tool.href} name={tool.name} benefit={tool.benefit} icon={tool.icon} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="mt-8" aria-labelledby="mesh-guides-heading">
        <h2 id="mesh-guides-heading" className="text-lg font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">
          Guides
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {MESH_GUIDES.map((guide) => (
            <li key={guide.slug} className="rounded-[20px] border border-[#E2E8E5] bg-white p-4 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card">
              <Link href={`/mesh-wifi/guides/${guide.slug}`} className="font-semibold text-[#006B53] hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]">
                {guide.title}
              </Link>
              <p className="mt-1 text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{guide.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </ToolShell>
  );
}
