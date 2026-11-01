import type { Metadata } from "next";
import Link from "next/link";
import { MeshTroubleshooter } from "@/components/mesh/mesh-troubleshooter";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Is My Mesh Wi-Fi Slow?",
  description: "A rules checklist for offline nodes, weak upstairs coverage, double NAT, and slow wireless hops. Free steps come first.",
  path: "/mesh-wifi/troubleshooter",
});

export default function MeshTroubleshootPage() {
  return (
    <ToolShell
      title="Why Is My Mesh Wi-Fi Slow?"
      description="Mesh symptom checklist"
      path="/mesh-wifi/troubleshooter"
      crumbs={meshCrumbs("Why Is My Mesh Wi-Fi Slow?")}
      intro="Pick what you see. The checklist uses your symptoms and any room tests saved on this device. It cannot see router settings or which node a device joined."
      hideHeader
      methodologyHeading="How this assistant works"
      methodology="Recommendations come from the symptoms and answers you enter, plus room tests already saved on this device. A speed test runs only after you start it on the speed test page. Planner colors are an estimate, not a measured signal. This site cannot see router settings, node association, firmware, or backhaul quality, and it does not ask for a Wi-Fi or router password."
      faqs={[
        { question: "Can this see my router settings?", answer: "No. Recommendations come from the symptoms you select, the answers you type, and any room tests saved on this device." },
        { question: "Will this page start a speed test?", answer: "No. Open the speed test or the room test and start it there. This page can show a result you already saved." },
        { question: "Does a speed difference prove the link between nodes is faulty?", answer: "No. Two speed tests can differ because of the device, interference, the time of day, or other traffic. That gap is worth checking. It is not a backhaul measurement." },
        { question: "Are the planner colors a signal reading?", answer: "No. Coverage colors in the floor planner are an estimate. A room test is a speed test you start, not a signal-strength reading." },
        { question: "When might another node help?", answer: "After a test beside the primary node is healthy and a test in the slow room stays lower. If the primary node is already slow, another node will not fix the ISP link." },
      ]}
      related={[
        { href: "/speed-test", label: "Speed test" },
        { href: "/mesh-wifi/planner", label: "Floor planner" },
        { href: "/mesh-wifi/dead-zone-test", label: "Room test" },
        { href: "/network-health", label: "Network health" },
        { href: "/router-setup", label: "Router setup" },
        { href: "/dns-speed-test", label: "DNS timing" },
        { href: "/ping-test", label: "Latency" },
        { href: "/jitter-test", label: "Jitter" },
        { href: "/internet-troubleshooter", label: "General troubleshooter" },
      ]}
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <header className="mb-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-3xl">Why Is My Mesh Wi-Fi Slow?</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Pick what you see. The checklist uses your symptoms and any room tests saved on this device. It cannot see router settings, which node a device joined, firmware, or backhaul quality.
          </p>
        </header>
        <section aria-labelledby="wifi-assistant-heading">
          <h2 id="wifi-assistant-heading" className="font-heading text-lg font-semibold text-[#0F172A]">Wi-Fi Troubleshooting Assistant</h2>
          <p className="mt-1 text-sm text-[#64748B]">Find out what may be slowing down your Wi-Fi and what to check next.</p>
          <div className="mt-4">
            <MeshTroubleshooter />
          </div>
        </section>
        <MeshSlowGuide />
      </div>
    </ToolShell>
  );
}

function MeshSlowGuide() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-6 text-[#64748B]" aria-labelledby="mesh-slow-guide">
      <h2 id="mesh-slow-guide" className="font-heading text-lg font-semibold text-[#0F172A]">Why mesh Wi-Fi can be slower than expected</h2>
      <p>
        A mesh kit spreads Wi-Fi through a home, and each wireless hop shares airtime with phones and laptops unless that model has a radio set aside for the hop. A speed test in a far room is often lower than a test beside the primary node. That gap is a difference in throughput to the test server. It is not a signal-strength reading, and it does not by itself prove the link between nodes is faulty.
      </p>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">Wireless versus Ethernet backhaul</h3>
        <p className="mt-1">
          Ethernet or MoCA gives the satellite a wired path back to the primary node. A wireless hop does not. If a cable path already exists, it is the first thing to try before adding another node. The <Link className="font-medium text-[#00866A]" href="/mesh-wifi/guides/ethernet-vs-wireless-backhaul">Ethernet and wireless backhaul guide</Link> and the <Link className="font-medium text-[#00866A]" href="/mesh-wifi/backhaul-advisor">backhaul advisor</Link> walk through that choice. This site cannot see how your nodes are linked.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">Placement mistakes</h3>
        <p className="mt-1">
          A satellite tucked in the dead spot is often too far from the primary node to help the rooms in between. Place it where it still hears the primary node, around table height and out of a cabinet. The <Link className="font-medium text-[#00866A]" href="/mesh-wifi/guides/where-to-place-mesh-nodes">placement guide</Link> and the <Link className="font-medium text-[#00866A]" href="/mesh-wifi/planner">floor planner</Link> are for that experiment. Planner colors are an estimate, not a measured signal map.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">Walls and floors</h3>
        <p className="mt-1">
          Brick, concrete, and floor decks block more than an open hallway. A second floor usually needs a node near the stair opening rather than in a far bedroom, unless that bedroom is the only priority. The <Link className="font-medium text-[#00866A]" href="/mesh-wifi/guides/upstairs-mesh-coverage">upstairs coverage guide</Link> covers that layout. Confirm it with a room test upstairs and downstairs.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">Why a device stays on a distant node</h3>
        <p className="mt-1">
          Phones and laptops choose when to roam. A device can stay attached to a farther node after you walk into another room. This page cannot see that association. The vendor app is where the connected node is listed. After it shows a different node, run the room test again.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">Compare the primary node and a satellite</h3>
        <p className="mt-1">
          Start a <Link className="font-medium text-[#00866A]" href="/speed-test">speed test</Link> beside the primary node, then start the same test near the satellite on the same device, with other large downloads paused. Compare download, upload, latency, and jitter when those results exist. A <Link className="font-medium text-[#00866A]" href="/mesh-wifi/dead-zone-test">room test</Link> can save the pair. Differences can also come from the device, interference, the time of day, and other traffic.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">When another node may help</h3>
        <p className="mt-1">
          Add a node after the wired or primary-node test looks healthy and the far room stays slower, and after you have already moved the nearest node closer. If the primary node is slow on its own, another satellite will not repair the ISP link. <Link className="font-medium text-[#00866A]" href="/wifi-vs-ethernet">Wi-Fi versus Ethernet</Link>, <Link className="font-medium text-[#00866A]" href="/network-health">network health</Link>, <Link className="font-medium text-[#00866A]" href="/ping-test">latency</Link>, <Link className="font-medium text-[#00866A]" href="/jitter-test">jitter</Link>, and <Link className="font-medium text-[#00866A]" href="/dns-speed-test">DNS timing</Link> are separate checks you start yourself. <Link className="font-medium text-[#00866A]" href="/router-setup">Router setup</Link> does not ask for the router password.
        </p>
      </div>
    </section>
  );
}
