import type { Metadata } from "next";
import Link from "next/link";
import { ToolShell } from "@/components/seo/tool-shell";
import { MESH_GUIDES } from "@/lib/mesh/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Setup and Placement",
  description: "Plan mesh Wi-Fi placement, estimate how many nodes you need, and test each room before you buy more hardware.",
  path: "/mesh-wifi",
});

const CARDS = [
  { href: "/mesh-wifi/planner", title: "Floor planner", body: "Draw rooms, drag nodes, and see an estimated coverage map you can correct with measurements." },
  { href: "/mesh-wifi/dead-zone-test", title: "Room tests", body: "Run the speed test in a room you choose and keep that result with the room." },
  { href: "/mesh-wifi/node-calculator", title: "Node calculator", body: "A starting count from size and construction, including when one router is enough." },
  { href: "/mesh-wifi/setup", title: "Setup wizard", body: "A model-aware checklist for eero, Nest, Deco, Orbi, ZenWiFi, Velop, or another kit." },
  { href: "/mesh-wifi/placement-optimizer", title: "Placement options", body: "Four layouts you can apply and then edit. Not a claim of a perfect plan." },
  { href: "/mesh-wifi/backhaul-advisor", title: "Backhaul", body: "Ethernet, wireless, coax, and powerline, with the limits called out." },
  { href: "/mesh-wifi/troubleshooter", title: "Mesh troubleshooter", body: "Rules from your symptoms and any room tests you saved." },
  { href: "/mesh-wifi/wifi-6-vs-wifi-7", title: "Wi-Fi 6, 6E, and 7", body: "What changes in a house, and when the newest kit does not help." },
];

export default function MeshHomePage() {
  return (
    <ToolShell
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
      <ul className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card) => (
          <li key={card.href}>
            <Link href={card.href} className="block h-full rounded-2xl border border-border bg-card p-4 hover:border-primary">
              <h2 className="text-base font-semibold">{card.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-8" aria-labelledby="mesh-guides-heading">
        <h2 id="mesh-guides-heading" className="text-lg font-semibold">Guides</h2>
        <ul className="mt-3 space-y-2">
          {MESH_GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/mesh-wifi/guides/${guide.slug}`} className="font-medium text-primary hover:underline">{guide.title}</Link>
              <p className="text-sm text-muted-foreground">{guide.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </ToolShell>
  );
}
